import { describe, expect, it } from 'vitest';

import { createMockRequestEvent } from '$test/testUtils';

/**
 * Admin action auth guard tests.
 *
 * Verifies that every admin action returns a non-success response when
 * called without authentication (empty locals — no api client).
 * The guard checks `client?.authStore?.record?.admin` which is falsy when
 * `locals.api` is undefined.
 */

describe('admin translations auth guards', () => {
  it('save action errors without auth', async () => {
    const mod = await import('../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.save(event as never)).rejects.toThrow();
  });

  it('delete action errors without auth', async () => {
    const mod = await import('../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.delete(event as never)).rejects.toThrow();
  });

  it('add action errors without auth', async () => {
    const mod = await import('../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.add(event as never)).rejects.toThrow();
  });

  it('redeploy action errors without auth', async () => {
    const mod = await import('../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.redeploy(event as never)).rejects.toThrow();
  });

  it('status action errors without auth', async () => {
    const mod = await import('../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.status(event as never)).rejects.toThrow();
  });
});

describe('admin users auth guards', () => {
  it('update action errors without auth', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'user123' } });
    await expect(mod.actions.update(event as never)).rejects.toThrow();
  });

  it('deleteAccount action errors without auth', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'user123' } });
    await expect(mod.actions.deleteAccount(event as never)).rejects.toThrow();
  });

  it('unlink action errors without auth', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'user123' } });
    await expect(mod.actions.unlink(event as never)).rejects.toThrow();
  });

  it('assign action errors without auth', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'user123' } });
    await expect(mod.actions.assign(event as never)).rejects.toThrow();
  });

  it('resetPassword action errors without auth', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'user123' } });
    await expect(mod.actions.resetPassword(event as never)).rejects.toThrow();
  });
});

describe('admin pages auth guards', () => {
  it('save action errors without auth ([id])', async () => {
    const mod = await import('../../routes/admin/pages/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'page123' } });
    await expect(mod.actions.save(event as never)).rejects.toThrow();
  });

  it('save action errors without auth (new)', async () => {
    const mod = await import('../../routes/admin/pages/new/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.save(event as never)).rejects.toThrow();
  });
});

describe('admin congregation API auth guards', () => {
  it('toggle POST errors without auth', async () => {
    const mod = await import('../../routes/api/admin/congregations/[id]/toggle/+server');
    const event = createMockRequestEvent({ params: { id: 'cong123' } });
    await expect(mod.POST(event as never)).rejects.toThrow();
  });

  it('delete errors without auth', async () => {
    const mod = await import('../../routes/api/admin/congregations/[id]/delete/+server');
    const event = createMockRequestEvent({ params: { id: 'cong123' } });
    await expect(mod.DELETE(event as never)).rejects.toThrow();
  });
});

describe('admin cache clear auth guard', () => {
  it('POST errors without auth', async () => {
    const mod = await import('../../routes/api/admin/cache/clear/+server');
    const event = createMockRequestEvent();
    await expect(mod.POST(event as never)).rejects.toThrow();
  });
});

describe('admin users export auth guard', () => {
  it('GET errors without auth', async () => {
    const mod = await import('../../routes/admin/users/export/+server');
    const event = createMockRequestEvent();
    await expect(mod.GET(event as never)).rejects.toThrow();
  });
});

describe('admin dashboard auth guard', () => {
  it('load errors without auth', async () => {
    const mod = await import('../../routes/admin/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.load(event as never)).rejects.toThrow();
  });
});
