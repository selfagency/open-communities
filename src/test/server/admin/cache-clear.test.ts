import { describe, expect, it } from 'vitest';

describe('POST /api/admin/cache/clear', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/api/admin/cache/clear/+server');
    const event = { locals: { api: { authStore: { record: null } } } };
    try {
      await mod.POST(event as never);
      expect.fail('Expected error to be thrown');
    } catch (e) {
      expect((e as { status: number }).status).toBe(401);
    }
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
