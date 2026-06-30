import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { withRetry } from '$lib/server/api';
import { log } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

const variantSchema = z.object({
  id: z.string().optional(),
  language: z.string(),
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  content: z.string().optional().default(''),
  imageAlt: z.string().optional().default(''),
  imageCaption: z.string().optional().default('')
});

interface TranslateResult {
  locale: string;
  translatedText: string;
}

async function translateLocale(text: string, locale: string, apiUrl: string, ltKey?: string): Promise<TranslateResult> {
  const res = await fetch(`${apiUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'en',
      target: locale,
      format: 'text',
      ...(ltKey ? { api_key: ltKey } : {})
    })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      ((body as Record<string, unknown>)?.error as string) ?? `Translation failed for ${locale}: ${res.status}`
    );
  }

  const data = (await res.json()) as { translatedText: string };
  return { locale, translatedText: data.translatedText };
}

function processTranslationResults(rawResults: PromiseSettledResult<TranslateResult>[]): {
  translations: TranslateResult[];
  errors: string[];
} {
  const translations: TranslateResult[] = [];
  const errors: string[] = [];

  for (const result of rawResults) {
    if (result.status === 'fulfilled') {
      translations.push(result.value);
    } else {
      const msg = result.reason?.message ?? 'Unknown error';
      errors.push(msg);
      log.error('Translation failed', { error: msg });
    }
  }

  return { translations, errors };
}

export const load: PageServerLoad = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) {
    throw redirect(303, '/');
  }

  const pageId = params.id;

  let page: Record<string, unknown>;
  try {
    page = await withRetry(() => client.collection('pages').getOne(pageId));
  } catch {
    throw error(404, 'Page not found');
  }

  return {
    page
  };
};

export const actions = {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex component logic
  save: async ({ locals, params, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }

    const form = await request.formData();
    const title = form.get('title') as string;
    const slug = form.get('slug') as string;
    const description = form.get('description') as string;
    const content = form.get('content') as string;
    const imageAlt = form.get('imageAlt') as string;
    const imageCaption = form.get('imageCaption') as string;
    const variantsJson = form.get('variants') as string;
    const imageRaw = form.get('image');
    const imageFile = imageRaw instanceof File ? imageRaw : null;

    if (!(title && slug)) {
      return fail(400, { error: 'Title and slug are required' });
    }
    // biome-ignore lint/performance/useTopLevelRegex: intentional inline regex
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return fail(400, { error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
    }

    try {
      const body: Record<string, unknown> = {
        title,
        slug,
        description: description || '',
        content: content || '',
        imageAlt: imageAlt || '',
        imageCaption: imageCaption || ''
      };

      if (imageFile?.size && imageFile.size > 0) {
        body.image = imageFile;
      } else if (typeof imageRaw === 'string' && imageRaw.startsWith('data:image/')) {
        const base64 = imageRaw.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');
        body.image = new File([buffer], 'upload.png', { type: 'image/png' });
      }

      await withRetry(() => client.collection('pages').update(params.id, body));

      // Sync variants
      const variants: Array<{
        language: string;
        title: string;
        description: string;
        content: string;
        imageAlt: string;
        imageCaption: string;
        id?: string;
      }> = variantsJson ? z.array(variantSchema).parse(JSON.parse(variantsJson)) : [];

      for (const v of variants) {
        const vBody: Record<string, unknown> = {
          page: params.id,
          language: v.language,
          title: v.title || '',
          description: v.description || '',
          content: v.content || '',
          imageAlt: v.imageAlt || '',
          imageCaption: v.imageCaption || ''
        };

        if (v.id) {
          const vid = v.id;
          await withRetry(() => client.collection('pageVariants').update(vid, vBody));
        } else {
          await withRetry(() => client.collection('pageVariants').create(vBody));
        }
      }

      return { success: true };
    } catch {
      return fail(400, { error: 'Save failed' });
    }
  },

  translate: async ({ locals, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }

    const form = await request.formData();
    const text = form.get('text') as string;
    const localesStr = form.get('locales') as string;

    if (!(text && localesStr)) {
      return fail(400, { error: 'Missing text or locales' });
    }

    let locales: string[];
    try {
      locales = JSON.parse(localesStr) as string[];
    } catch {
      return fail(400, { error: 'Invalid locales JSON' });
    }

    const ltUrl = process.env.LT_API_URL;
    const ltKey = process.env.LT_API_KEY;
    if (!ltUrl) {
      return fail(500, { error: 'LibreTranslate is not configured' });
    }

    const apiUrl = ltUrl.endsWith('/') ? ltUrl.slice(0, -1) : ltUrl;

    const rawResults = await Promise.allSettled(locales.map((locale) => translateLocale(text, locale, apiUrl, ltKey)));

    const { translations, errors } = processTranslationResults(rawResults);
    if (translations.length === 0) {
      return fail(502, { error: errors[0] ?? 'All translations failed' });
    }

    return { success: true, translations, ...(errors.length > 0 ? { errors } : {}) };
  }
} satisfies Actions;
