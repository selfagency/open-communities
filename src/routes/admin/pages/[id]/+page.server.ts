import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { env } from '$env/dynamic/private';
import { withRetry } from '$lib/server/api';
import { processTranslationResults, translateLocale } from '$lib/server/translate';
import { pageSchema, pbErrorToFail, variantSchema } from '../_shared';
import type { Actions, PageServerLoad } from './$types';

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
    // biome-ignore lint/style/useErrorCause: SvelteKit error() helper doesn't accept a cause option
    throw error(404, 'Page not found');
  }

  return {
    page,
    saveForm: await superValidate(
      {
        content: (page.content as string) || '',
        description: (page.description as string) || '',
        imageAlt: (page.imageAlt as string) || '',
        imageCaption: (page.imageCaption as string) || '',
        published: (page.published as boolean | undefined) ?? true,
        slug: (page.slug as string) || '',
        title: (page.title as string) || ''
      },
      zod4(pageSchema)
    )
  };
};

export const actions = {
  // fallow-ignore-next-line complexity
  save: async ({ locals, params, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }

    const form = await superValidate(request, zod4(pageSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const fd = await request.formData();
    const variantsJson = fd.get('variants') as string;
    const imageRaw = fd.get('image');
    const imageFile = imageRaw instanceof File ? imageRaw : null;

    try {
      const body: Record<string, unknown> = { ...form.data };

      if (imageFile?.size && imageFile.size > 0) {
        body.image = imageFile;
      } else if (typeof imageRaw === 'string' && imageRaw.startsWith('data:image/')) {
        const [, base64] = imageRaw.split(',');
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
          content: v.content || '',
          description: v.description || '',
          imageAlt: v.imageAlt || '',
          imageCaption: v.imageCaption || '',
          language: v.language,
          page: params.id,
          title: v.title || ''
        };

        if (v.id) {
          const vid = v.id;
          // biome-ignore lint/performance/noAwaitInLoops: sequential variant writes are intentional
          await withRetry(() => client.collection('pageVariants').update(vid, vBody));
        } else {
          await withRetry(() => client.collection('pageVariants').create(vBody));
        }
      }

      return { form, success: true };
    } catch (err) {
      return pbErrorToFail(err);
    }
  },

  // fallow-ignore-next-line complexity
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

    const ltUrl = env.LT_API_URL;
    const ltKey = env.LT_API_KEY;
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
