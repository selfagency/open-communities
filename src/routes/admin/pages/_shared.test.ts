import { describe, expect, it } from 'vitest';
import { parsePageForm, pbErrorToFail } from './_shared';

function fd(o: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) {
    f.set(k, v);
  }
  return f;
}

describe('parsePageForm', () => {
  it('rejects empty title and slug', () => {
    const r = parsePageForm(fd({ slug: '', title: '' }));
    expect(r).toMatchObject({ error: 'Title and slug are required', ok: false });
  });

  it('rejects missing slug', () => {
    const r = parsePageForm(fd({ title: 'T' }));
    expect(r).toMatchObject({ error: 'Title and slug are required', ok: false });
  });

  it('rejects invalid slug (uppercase, spaces, special chars)', () => {
    const r = parsePageForm(fd({ slug: 'Bad Slug!', title: 'T' }));
    expect(r).toMatchObject({ field: 'slug', ok: false });
  });

  it('accepts valid page with defaults', () => {
    const r = parsePageForm(fd({ slug: 'my-page', title: 'My Page' }));
    expect(r).toMatchObject({
      data: {
        content: '',
        description: '',
        imageAlt: '',
        imageCaption: '',
        slug: 'my-page',
        title: 'My Page'
      },
      ok: true
    });
  });

  it('trims title and slug whitespace', () => {
    const r = parsePageForm(fd({ slug: '  trimmed-slug  ', title: '  Trimmed  ' }));
    expect(r).toMatchObject({
      data: { slug: 'trimmed-slug', title: 'Trimmed' },
      ok: true
    });
  });

  it('accepts full page data', () => {
    const r = parsePageForm(
      fd({ content: 'Body', description: 'Desc', imageAlt: 'Alt', imageCaption: 'Cap', slug: 'full', title: 'Full' })
    );
    expect(r).toMatchObject({
      data: { content: 'Body', description: 'Desc', imageAlt: 'Alt', imageCaption: 'Cap', slug: 'full', title: 'Full' },
      ok: true
    });
  });
});

describe('pbErrorToFail', () => {
  it('maps PocketBase 400 field error → fail with field', () => {
    const e = { data: { data: { slug: { message: 'slug already in use' } } }, status: 400 };
    const r = pbErrorToFail(e);
    expect(r.status).toBe(400);
    expect((r.data as Record<string, unknown>).error).toBe('slug already in use');
    expect((r.data as Record<string, unknown>).field).toBe('slug');
  });

  it('maps status 0 (network error) → 502', () => {
    const r = pbErrorToFail({ status: 0 });
    expect(r.status).toBe(502);
  });

  it('defaults unknown error → 500', () => {
    const r = pbErrorToFail(new Error('unknown'));
    expect(r.status).toBe(500);
    expect((r.data as Record<string, unknown>).error).toBe('Save failed');
  });
});
