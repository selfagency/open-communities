import { describe, expect, it, vi } from 'vitest';

import { createMockRequestEvent } from '$test/testUtils';

vi.mock('$lib/server/logger', () => ({
  log: { error: () => {} }
}));

describe('admin +layout.server', () => {
  it('redirects non-admin users to /', async () => {
    const mod = await import('../../routes/admin/+layout.server');
    const event = createMockRequestEvent({
      locals: {
        api: { authStore: { record: { id: 'u1', admin: false } } }
      }
    });

    await expect(mod.load(event as any)).rejects.toThrow();
  });

  it('allows admin users through', async () => {
    const mod = await import('../../routes/admin/+layout.server');
    const event = createMockRequestEvent({
      locals: {
        api: { authStore: { record: { id: 'u1', admin: true } } }
      }
    });

    const result = (await mod.load(event as any))!;
    expect(result.title).toBe('Dashboard');
    expect(result.user!.admin).toBe(true);
  });

  it('redirects unauthenticated users to /', async () => {
    const mod = await import('../../routes/admin/+layout.server');
    const event = createMockRequestEvent({
      locals: {
        api: { authStore: { record: null } }
      }
    });

    await expect(mod.load(event as any)).rejects.toThrow();
  });
});

describe('admin +page.server (dashboard)', () => {
  it('loads stats from PocketBase', async () => {
    const mod = await import('../../routes/admin/+page.server');
    const api = {
      collection: () => ({
        getList: vi.fn().mockResolvedValue({ totalItems: 42 })
      })
    } as any;

    const event = createMockRequestEvent({ locals: { api } });
    const result = (await mod.load(event as any))!;

    expect(result.stats.congregations).toBe(42);
    expect(result.stats.users).toBe(42);
    expect(result.stats.pendingApprovals).toBe(42);
  });
});

describe('admin/congregations +page.server', () => {
  it('loads congregations with pagination', async () => {
    const mod = await import('../../routes/admin/congregations/+page.server');
    const api = {
      collection: () => ({
        getList: vi.fn().mockResolvedValue({
          items: [{ id: 'c1', name: 'Test Cong' }],
          totalItems: 1
        })
      })
    } as any;

    const event = createMockRequestEvent({
      locals: { api },
      url: new URL('http://localhost/admin/congregations?page=1')
    });

    const result = (await mod.load(event as any))!;
    expect(result.congregations).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('filters by status', async () => {
    const mod = await import('../../routes/admin/congregations/+page.server');
    const getList = vi.fn().mockResolvedValue({ items: [], totalItems: 0 });
    const api = { collection: () => ({ getList }) } as any;

    const event = createMockRequestEvent({
      locals: { api },
      url: new URL('http://localhost/admin/congregations?status=visible')
    });

    await mod.load(event as any);
    expect(getList).toHaveBeenCalled();
  });
});

describe('admin/approvals +page.server', () => {
  it('loads new submissions and pending changes', async () => {
    const mod = await import('../../routes/admin/approvals/+page.server');
    const getList = vi.fn().mockResolvedValue({ items: [], totalItems: 0 });
    const api = { collection: () => ({ getList }) } as any;

    const event = createMockRequestEvent({ locals: { api } });
    const result = (await mod.load(event as any))!;

    expect(result.newSubmissions).toBeDefined();
    expect(result.pendingChanges).toBeDefined();
  });

  it('approves a congregation', async () => {
    const mod = await import('../../routes/admin/approvals/+page.server');
    const update = vi.fn().mockResolvedValue({});
    const getOne = vi.fn().mockResolvedValue({ id: 'c1', name: 'Test' });
    const api = {
      collection: () => ({ update, getOne })
    } as any;

    const form = new FormData();
    form.set('id', 'c1');

    const request = new Request('http://localhost/admin/approvals', {
      method: 'POST',
      body: form
    });

    const event = createMockRequestEvent({
      locals: { api },
      request
    });

    const result = await mod.actions.approve(event as any);
    expect(update).toHaveBeenCalledWith('c1', { visible: true });
    expect(result).toEqual({ success: true });
  });

  it('rejects and deletes a congregation', async () => {
    const mod = await import('../../routes/admin/approvals/+page.server');
    const del = vi.fn().mockResolvedValue({});
    const getOne = vi.fn().mockResolvedValue({ id: 'c1', name: 'Test' });
    const api = {
      collection: () => ({ delete: del, getOne })
    } as any;

    const form = new FormData();
    form.set('id', 'c1');
    form.set('reason', 'Not suitable');

    const request = new Request('http://localhost/admin/approvals', {
      method: 'POST',
      body: form
    });

    const event = createMockRequestEvent({
      locals: { api },
      request
    });

    const result = await mod.actions.reject(event as any);
    expect(del).toHaveBeenCalledWith('c1');
    expect(result).toEqual({ success: true });
  });
});

describe('admin/users +page.server', () => {
  it('loads users with pagination', async () => {
    const mod = await import('../../routes/admin/users/+page.server');
    const api = {
      collection: () => ({
        getList: vi.fn().mockResolvedValue({
          items: [{ id: 'u1', email: 'test@test.com' }],
          totalItems: 1
        })
      })
    } as any;

    const event = createMockRequestEvent({
      locals: { api },
      url: new URL('http://localhost/admin/users?page=1')
    });

    const result = (await mod.load(event as any))!;
    expect(result.users).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe('admin/users/export +server', () => {
  it('returns CSV with user data', async () => {
    const mod = await import('../../routes/admin/users/export/+server');
    const api = {
      collection: () => ({
        getFullList: vi.fn().mockResolvedValue([
          {
            name: 'User One',
            email: 'u1@test.com',
            lang: 'en',
            verified: true,
            admin: false,
            congregation: null,
            created: '2024-01-01'
          },
          {
            name: 'Admin User',
            email: 'admin@test.com',
            lang: 'fr',
            verified: true,
            admin: true,
            congregation: 'c1',
            created: '2024-01-02'
          }
        ])
      })
    } as any;

    const event = createMockRequestEvent({ locals: { api } });
    const response = await mod.GET(event as any);

    expect(response.headers.get('Content-Type')).toBe('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('users.csv');

    const text = await response.text();
    expect(text).toContain('Name,Email,Language');
    expect(text).toContain('User One');
    expect(text).toContain('Admin User');
  });
});

describe('admin/pages +page.server', () => {
  it('loads pages list', async () => {
    const mod = await import('../../routes/admin/pages/+page.server');
    const api = {
      collection: () => ({
        getList: vi.fn().mockResolvedValue({
          items: [{ id: 'p1', title: 'About', slug: 'about' }],
          totalItems: 1
        })
      })
    } as any;

    const event = createMockRequestEvent({ locals: { api } });
    const result = (await mod.load(event as any))!;

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].title).toBe('About');
  });
});

describe('admin/settings +page.server', () => {
  it('loads settings with node version', async () => {
    const mod = await import('../../routes/admin/settings/+page.server');
    const event = createMockRequestEvent({});
    const result = (await mod.load(event as any))!;

    expect(result.title).toBe('Settings');
    expect(result.nodeVersion).toBeDefined();
  });
});

describe('admin/congregations/[id]/toggle +server', () => {
  it('toggles congregation visibility', async () => {
    const mod = await import('../../routes/admin/congregations/[id]/toggle/+server');
    const getOne = vi.fn().mockResolvedValue({ id: 'c1', visible: false });
    const update = vi.fn().mockResolvedValue({});
    const api = { collection: () => ({ getOne, update }) } as any;

    const event = createMockRequestEvent({
      locals: { api },
      params: { id: 'c1' }
    });

    const result = await mod.POST(event as any);
    expect(update).toHaveBeenCalledWith('c1', { visible: true });
    expect(result).toBeDefined();
  });
});
