import { describe, it, expect } from 'vitest';
import { parsePageForm, pbErrorToFail } from './_shared';

function fd(o: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}

describe('parsePageForm', () => {
  it('rejects empty title and slug', () => {
    const r = parsePageForm(fd({ title: '', slug: '' }));
    expect(r).toMatchObject({ ok: false, error: 'Title and slug are required' });
  });

  it('rejects missing slug', () => {
    const r = parsePageForm(fd({ title: 'T' }));
    expect(r).toMatchObject({ ok: false, error: 'Title and slug are required' });
  });

  it('rejects invalid slug (uppercase, spaces, special chars)', () => {
    const r = parsePageForm(fd({ title: 'T', slug: 'Bad Slug!' }));
    expect(r).toMatchObject({ ok: false, field: 'slug' });
  });

  it('accepts valid page with defaults', () => {
    const r = parsePageForm(fd({ title: 'My Page', slug: 'my-page' }));
    expect(r).toMatchObject({
      ok: true,
      data: {
        title: 'My Page',
        slug: 'my-page',
        content: '',
        description: '',
        imageAlt: '',
        imageCaption: ''
      }
    });
  });

  it('trims title and slug whitespace', () => {
    const r = parsePageForm(fd({ title: '  Trimmed  ', slug: '  trimmed-slug  ' }));
    expect(r).toMatchObject({
      ok: true,
      data: { title: 'Trimmed', slug: 'trimmed-slug' }
    });
  });

  it('accepts full page data', () => {
    const r = parsePageForm(
      fd({ title: 'Full', slug: 'full', content: 'Body', description: 'Desc', imageAlt: 'Alt', imageCaption: 'Cap' })
    );
    expect(r).toMatchObject({
      ok: true,
      data: { title: 'Full', slug: 'full', content: 'Body', description: 'Desc', imageAlt: 'Alt', imageCaption: 'Cap' }
    });
  });
});

describe('pbErrorToFail', () => {
  it('maps PocketBase 400 field error → fail with field', () => {
    const e = { status: 400, data: { data: { slug: { message: 'slug already in use' } } } };
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
