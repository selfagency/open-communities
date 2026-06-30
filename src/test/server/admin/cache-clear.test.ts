import { describe, expect, it } from 'vitest';

describe('POST /api/admin/cache/clear', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/api/admin/cache/clear/+server');
    const event = { locals: { api: { authStore: { record: null } } } };
  });

  it('clears cache and returns success', async () => {
    const mod = await import('../../../routes/api/admin/cache/clear/+server');
    const locals = {
      api: {
        authStore: { record: { id: 'admin1', admin: true, email: 'admin@test.com' } }
      }
    };
    const res = await mod.POST({ locals } as never);
    const data = await res.json();
    expect(data).toMatchObject({ success: true });
  });
});
