import { fail, redirect } from '@sveltejs/kit';
import { withRetry } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

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
      throw redirect(303, '/');
    }

    const form = await request.formData();
    const title = form.get('title') as string;
    const slug = form.get('slug') as string;
    const description = form.get('description') as string;
    const content = form.get('content') as string;
    const imageAlt = form.get('imageAlt') as string;
    const imageCaption = form.get('imageCaption') as string;
    const variantsJson = form.get('variants') as string;
    const imageFile = form.get('image') as File | null;

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
      }> = variantsJson ? JSON.parse(variantsJson) : [];

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
      return fail(400, { error: 'Save failed' });
    }
  }
} satisfies Actions;
