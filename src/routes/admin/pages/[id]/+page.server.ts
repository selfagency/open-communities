import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { withRetry } from '$lib/server/api';
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
    page: page as unknown as Record<string, unknown>
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
  }
} satisfies Actions;
