import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { withRetry } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';
import { parsePageForm, pbErrorToFail } from '../_shared';

const variantSchema = z.object({
  id: z.string().optional(),
  language: z.string(),
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  content: z.string().optional().default(''),
  imageAlt: z.string().optional().default(''),
  imageCaption: z.string().optional().default('')
});

// biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) {
    throw redirect(303, '/');
  }

  return {};
};

export const actions = {
  save: async ({ locals, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }

    const form = await request.formData();
    const parsed = parsePageForm(form);
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, field: parsed.field });
    }

    const variantsJson = form.get('variants') as string;
    const imageRaw = form.get('image');
    const imageFile = imageRaw instanceof File ? imageRaw : null;

    try {
      const body: Record<string, unknown> = { ...parsed.data };

      if (imageFile?.size && imageFile.size > 0) {
        body.image = imageFile;
      } else if (typeof imageRaw === 'string' && imageRaw.startsWith('data:image/')) {
        const base64 = imageRaw.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');
        body.image = new File([buffer], 'upload.png', { type: 'image/png' });
      }

      const page = await withRetry(() => client.collection('pages').create(body));

      // Create variants
      const variants: Array<{
        language: string;
        title: string;
        description: string;
        content: string;
        imageAlt: string;
        imageCaption: string;
      }> = variantsJson ? z.array(variantSchema).parse(JSON.parse(variantsJson)) : [];

      for (const v of variants) {
        await withRetry(() =>
          client.collection('pageVariants').create({
            page: page.id,
            language: v.language,
            title: v.title || '',
            description: v.description || '',
            content: v.content || '',
            imageAlt: v.imageAlt || '',
            imageCaption: v.imageCaption || ''
          })
        );
      }

      throw redirect(303, '/admin/pages');
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 303) {
        throw err;
      }
      return pbErrorToFail(err);
    }
  }
} satisfies Actions;
