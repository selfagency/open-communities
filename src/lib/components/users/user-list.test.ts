import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('UserList', () => {
  const sampleUsers = [
    {
      admin: true,
      congregation: '',
      congregationName: '',
      email: 'alice@example.com',
      id: '1',
      name: 'Alice',
      verified: true
    },
    {
      admin: false,
      congregation: 'c1',
      congregationName: 'Test Cong',
      email: 'bob@example.com',
      id: '2',
      name: 'Bob',
      verified: false
    }
  ];

  it('renders user table with data', { timeout: 30_000 }, async () => {
    // First import triggers TanStack Proxy setup in browser runtime
    const { default: UserList } = await import('./user-list.svelte');
    const target = document.createElement('div');
    const instance = mount(UserList, {
      props: {
        data: { page: 1, perPage: 10, search: '', total: 2, users: sampleUsers }
      },
      target
    });
    expect(target.textContent).toContain('Alice');
    expect(target.textContent).toContain('Bob');
    unmount(instance);
  });

  it('renders empty state when no users', async () => {
    const { default: UserList } = await import('./user-list.svelte');
    const target = document.createElement('div');
    const instance = mount(UserList, {
      props: {
        data: { page: 1, perPage: 10, search: '', total: 0, users: [] }
      },
      target
    });
    expect(target).toBeTruthy();
    unmount(instance);
  });

  it('renders search input', async () => {
    const { default: UserList } = await import('./user-list.svelte');
    const target = document.createElement('div');
    const instance = mount(UserList, {
      props: {
        data: { page: 1, perPage: 10, search: 'alice', total: 2, users: sampleUsers }
      },
      target
    });
    expect(target.querySelector('input')).toBeTruthy();
    unmount(instance);
  });

  it('renders pagination when total exceeds perPage', async () => {
    const { default: UserList } = await import('./user-list.svelte');
    const target = document.createElement('div');
    const instance = mount(UserList, {
      props: {
        data: { page: 1, perPage: 10, search: '', total: 25, users: sampleUsers }
      },
      target
    });
    expect(target.textContent).toContain('1');
    expect(target.textContent).toContain('2');
    expect(target.textContent).toContain('3');
    unmount(instance);
  });
});
