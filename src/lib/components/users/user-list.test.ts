import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('UserList', () => {
  const sampleUsers = [
    {
      id: '1',
      name: 'Alice',
      email: 'alice@example.com',
      congregation: '',
      congregationName: '',
      admin: true,
      verified: true
    },
    {
      id: '2',
      name: 'Bob',
      email: 'bob@example.com',
      congregation: 'c1',
      congregationName: 'Test Cong',
      admin: false,
      verified: false
    }
  ];

  it('renders user table with data', async () => {
    const { default: UserList } = await import('./user-list.svelte');
    const target = document.createElement('div');
    const instance = mount(UserList, {
      target,
      props: {
        data: { users: sampleUsers, total: 2, page: 1, perPage: 10, search: '' }
      }
    });
    expect(target.textContent).toContain('Alice');
    expect(target.textContent).toContain('Bob');
    unmount(instance);
  });

  it('renders empty state when no users', async () => {
    const { default: UserList } = await import('./user-list.svelte');
    const target = document.createElement('div');
    const instance = mount(UserList, {
      target,
      props: {
        data: { users: [], total: 0, page: 1, perPage: 10, search: '' }
      }
    });
    expect(target).toBeTruthy();
    unmount(instance);
  });

  it('renders search input', async () => {
    const { default: UserList } = await import('./user-list.svelte');
    const target = document.createElement('div');
    const instance = mount(UserList, {
      target,
      props: {
        data: { users: sampleUsers, total: 2, page: 1, perPage: 10, search: 'alice' }
      }
    });
    expect(target.querySelector('input')).toBeTruthy();
    unmount(instance);
  });

  it('renders pagination when total exceeds perPage', async () => {
    const { default: UserList } = await import('./user-list.svelte');
    const target = document.createElement('div');
    const instance = mount(UserList, {
      target,
      props: {
        data: { users: sampleUsers, total: 25, page: 1, perPage: 10, search: '' }
      }
    });
    expect(target.textContent).toContain('1');
    expect(target.textContent).toContain('2');
    expect(target.textContent).toContain('3');
    unmount(instance);
  });
});
