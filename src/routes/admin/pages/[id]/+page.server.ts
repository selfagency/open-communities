import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) throw redirect(303, '/');

  const pageId = params.id;

  let page: Record<string, unknown>;
  try {
    page = await client.collection('pages').getOne(pageId);
  } catch {
    throw error(404, 'Page not found');
  }

  const variants = await client
    .collection('pageVariants')
    .getFullList({
      filter: client.filter('page = {:pageId}', { pageId }),
      requestKey: `page-variants-${pageId}`
    })
    .catch(() => []);

  return {
    page: page as Record<string, unknown>,
    variants: (variants as Array<Record<string, unknown>>).map((v) => ({
      id: v.id,
      language: v.language,
      title: (v.title as string) ?? '',
      description: (v.description as string) ?? '',
      content: (v.content as string) ?? '',
      imageAlt: (v.imageAlt as string) ?? '',
      imageCaption: (v.imageCaption as string) ?? ''
    }))
  };
};

export const actions = {
  save: async ({ locals, params, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) throw redirect(303, '/');

    const form = await request.formData();
    const title = form.get('title') as string;
    const slug = form.get('slug') as string;
    const description = form.get('description') as string;
    const content = form.get('content') as string;
    const imageAlt = form.get('imageAlt') as string;
    const imageCaption = form.get('imageCaption') as string;
    const variantsJson = form.get('variants') as string;
    const imageFile = form.get('image') as File | null;

    if (!title || !slug) return fail(400, { error: 'Title and slug are required' });
    if (!/^[a-z0-9-]+$/.test(slug))
      return fail(400, { error: 'Slug must contain only lowercase letters, numbers, and hyphens' });

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

      await client.collection('pages').update(params.id, body);

      // Sync variants
      const variants: Array<{
        language: string;
        title: string;
        description: string;
        content: string;
        imageAlt: string;
        imageCaption: string;
        id?: string;
      }> = variantsJson ? JSON.parse(variantsJson) : [];

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
          await client.collection('pageVariants').update(v.id, vBody);
        } else {
          await client.collection('pageVariants').create(vBody);
        }
      }

      return { success: true };
    } catch (_err: unknown) {
      return fail(400, { error: 'Save failed' });
    }
  }
} satisfies Actions;
