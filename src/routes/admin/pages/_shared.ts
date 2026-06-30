import { fail } from '@sveltejs/kit';

export interface ParsedPage {
  content: string;
  description: string;
  imageAlt: string;
  imageCaption: string;
  slug: string;
  title: string;
}

/**
 * Pure validation: parse FormData → ParsedPage.
 * Throws nothing, returns discriminated result.
 * Unit-testable without SvelteKit context.
 */
export function parsePageForm(
  fd: FormData
): { ok: true; data: ParsedPage } | { ok: false; error: string; field?: string } {
  const title = (fd.get('title') ?? '').toString().trim();
  if (!title) {
    return { ok: false, error: 'Title is required', field: 'title' };
  }

  const slug = (fd.get('slug') ?? '').toString().trim();
  if (!slug) {
    return { ok: false, error: 'Slug is required', field: 'slug' };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens', field: 'slug' };
  }

  return {
    ok: true,
    data: {
      title,
      slug,
      content: (fd.get('content') ?? '').toString(),
      description: (fd.get('description') ?? '').toString(),
      imageAlt: (fd.get('imageAlt') ?? '').toString(),
      imageCaption: (fd.get('imageCaption') ?? '').toString()
    }
  };
}

/**
 * Pure error mapping: PocketBase ClientResponseError → SvelteKit fail payload.
 */
export function pbErrorToFail(e: unknown): ReturnType<typeof fail> {
  const status = (e as { status?: number })?.status ?? 500;
  const data = (e as { data?: { data?: Record<string, { message: string }> } })?.data?.data ?? {};
  const field = Object.keys(data)[0];

  return fail(status === 0 ? 502 : status, {
    error: field ? data[field].message : 'Save failed',
    ...(field ? { field } : {})
  });
}
