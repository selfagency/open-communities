import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { withRetry } from '$lib/server/api';
import { pageSchema, pbErrorToFail, variantSchema } from '../_shared';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) {
    throw redirect(303, '/');
  }

  return {
    saveForm: await superValidate(zod4(pageSchema))
  };
};

export const actions = {
  // fallow-ignore-next-line complexity
  save: async ({ locals, request }) => {
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
        // biome-ignore lint/performance/noAwaitInLoops: sequential variant writes are intentional
        await withRetry(() =>
          client.collection('pageVariants').create({
            content: v.content || '',
            description: v.description || '',
            imageAlt: v.imageAlt || '',
            imageCaption: v.imageCaption || '',
            language: v.language,
            page: page.id,
            title: v.title || ''
          })
        );
      }

      throw redirect(303, `/admin/pages/${page.id}`);
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 303) {
        throw err;
      }
      return pbErrorToFail(err);
    }
  }
} satisfies Actions;
