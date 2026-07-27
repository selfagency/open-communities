import { fail } from '@sveltejs/kit';
import { z } from 'zod/v4';

const SLUG_RE = /^[a-z0-9-]+$/;

export const variantSchema = z.object({
  id: z.string().optional(),
  language: z.string(),
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  content: z.string().optional().default(''),
  imageAlt: z.string().optional().default(''),
  imageCaption: z.string().optional().default('')
});

/** Zod schema for the page form fields (all text/boolean inputs). */
export const pageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().regex(SLUG_RE, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  content: z.string().optional().default(''),
  description: z.string().optional().default(''),
  imageAlt: z.string().optional().default(''),
  imageCaption: z.string().optional().default(''),
  published: z.boolean().optional().default(true)
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
    return { ok: false, error: 'Title and slug are required' };
  }

  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens', field: 'slug' };
  }

  return {
    ok: true,
    data: {
      title,
      slug,
      content: getTextValue(fd, 'content'),
      description: getTextValue(fd, 'description'),
      imageAlt: getTextValue(fd, 'imageAlt'),
      imageCaption: getTextValue(fd, 'imageCaption'),
      published: fd.get('published') === 'true'
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
