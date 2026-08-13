import { fail } from '@sveltejs/kit';
import { z } from 'zod/v4';

const SLUG_RE = /^[a-z0-9-]+$/;

export const variantSchema = z.object({
  content: z.string().optional().default(''),
  description: z.string().optional().default(''),
  id: z.string().optional(),
  imageAlt: z.string().optional().default(''),
  imageCaption: z.string().optional().default(''),
  language: z.string(),
  title: z.string().optional().default('')
});

/** Zod schema for the page form fields (all text/boolean inputs). */
export const pageSchema = z.object({
  content: z.string().optional().default(''),
  description: z.string().optional().default(''),
  imageAlt: z.string().optional().default(''),
  imageCaption: z.string().optional().default(''),
  published: z.boolean().optional().default(true),
  slug: z.string().regex(SLUG_RE, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required')
});

/**
 * Safely extract a text value from FormData.
 * FormData.get() can return File | string | null, but we only expect strings
 * for text inputs. Returns empty string for non-string values to avoid
 * accidental [object Object] serialization.
 */
function getTextValue(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === 'string' ? v : '';
}

export interface ParsedPage {
  content: string;
  description: string;
  imageAlt: string;
  imageCaption: string;
  published: boolean;
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
  const title = getTextValue(fd, 'title').trim();
  const slug = getTextValue(fd, 'slug').trim();
  if (!(title && slug)) {
    return { error: 'Title and slug are required', ok: false };
  }

  if (!SLUG_RE.test(slug)) {
    return { error: 'Slug must contain only lowercase letters, numbers, and hyphens', field: 'slug', ok: false };
  }

  return {
    data: {
      content: getTextValue(fd, 'content'),
      description: getTextValue(fd, 'description'),
      imageAlt: getTextValue(fd, 'imageAlt'),
      imageCaption: getTextValue(fd, 'imageCaption'),
      published: fd.get('published') === 'true',
      slug,
      title
    },
    ok: true
  };
}

/**
 * Pure error mapping: PocketBase ClientResponseError → SvelteKit fail payload.
 */
export function pbErrorToFail(e: unknown): ReturnType<typeof fail> {
  const status = (e as { status?: number } | undefined)?.status ?? 500;
  const data = (e as { data?: { data?: Record<string, { message: string }> } } | undefined)?.data?.data ?? {};
  const [field] = Object.keys(data);

  return fail(status === 0 ? 502 : status, {
    error: field && Object.hasOwn(data, field) ? data[field].message : 'Save failed',
    ...(field && Object.hasOwn(data, field) ? { field } : {})
  });
}
