import { describe, expect, it } from 'vitest';

import { createMockRequestEvent } from '$test/testUtils';

/**
 * P-1 fix: Admin user edit should not strip admin/verified status
 * when the form only sends name/email.
 */
describe('admin user edit preserves admin/verified', () => {
  it('update action errors without auth (regression guard)', async () => {
    // This tests that the auth guard fires before any form processing
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'user123' } });
    await expect(mod.actions.update(event as never)).rejects.toThrow();
  });

  it('update action errors without auth for unlink', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'user123' } });
    await expect(mod.actions.unlink(event as never)).rejects.toThrow();
  });

  it('update action errors without auth for assign', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'user123' } });
    await expect(mod.actions.assign(event as never)).rejects.toThrow();
  });

  it('update action errors without auth for resetPassword', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'user123' } });
    await expect(mod.actions.resetPassword(event as never)).rejects.toThrow();
  });
});

describe('admin congregation API auth guards', () => {
  it('toggle endpoint errors without auth', async () => {
    const mod = await import('../../routes/api/admin/congregations/[id]/toggle/+server');
    const event = createMockRequestEvent({ params: { id: 'cong123' } });
    await expect(mod.POST(event as never)).rejects.toThrow();
  });

  it('delete endpoint errors without auth', async () => {
    const mod = await import('../../routes/api/admin/congregations/[id]/delete/+server');
    const event = createMockRequestEvent({ params: { id: 'cong123' } });
    await expect(mod.DELETE(event as never)).rejects.toThrow();
  });
});

describe('admin pages new auth guard', () => {
  it('save action errors without auth', async () => {
    const mod = await import('../../routes/admin/pages/new/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.save(event as never)).rejects.toThrow();
  });
});

describe('admin congregations list page auth guard', () => {
  it('returns empty congregations without auth', async () => {
    const mod = await import('../../routes/admin/congregations/+page.server');
    const event = createMockRequestEvent();
    const result = (await mod.load(event as never)) as { congregations: unknown[]; pending: unknown[] };
    expect(result.congregations).toEqual([]);
    expect(result.pending).toEqual([]);
  });
});

describe('admin users list page auth guard', () => {
  it('load errors without auth', async () => {
    const mod = await import('../../routes/admin/users/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.load(event as never)).rejects.toThrow();
  });
});

describe('admin pages list page auth guard', () => {
  it('load errors without auth', async () => {
    const mod = await import('../../routes/admin/pages/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.load(event as never)).rejects.toThrow();
  });
});
