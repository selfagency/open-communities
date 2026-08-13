import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import type { PagesRecord, UsersRecord } from '$lib/pocketbase.d';

// isomorphic-dompurify needs JSDOM, not happy-dom — mock it
vi.mock('isomorphic-dompurify', () => ({
  default: { sanitize: (s: string) => s }
}));

describe('FormAlerts', () => {
  const adminUser = { admin: true, id: 'admin1' } as UsersRecord & { id: string };
  const regularUser = { admin: false, id: 'user1' } as UsersRecord & { id: string };
  const sampleContent = { content: '<p>Hello world</p>' } as PagesRecord;

  it('renders content preview in add mode', async () => {
    const { default: FormAlerts } = await import('./form-alerts.svelte');
    const target = document.createElement('div');
    const instance = mount(FormAlerts, {
      props: { content: sampleContent, formSuccess: false, mode: 'add', user: adminUser },
      target
    });
    expect(target.textContent).toContain('Hello world');
    unmount(instance);
  });

  it('renders nothing in add mode without content', async () => {
    const { default: FormAlerts } = await import('./form-alerts.svelte');
    const target = document.createElement('div');
    const instance = mount(FormAlerts, {
      props: { content: undefined, formSuccess: false, mode: 'add', user: adminUser },
      target
    });
    // rendered element has whitespace from Alert.Root layout
    expect(target.textContent?.trim()).toBe('');
    unmount(instance);
  });

  it('renders edit notice when user is not admin', async () => {
    const { default: FormAlerts } = await import('./form-alerts.svelte');
    const target = document.createElement('div');
    const instance = mount(FormAlerts, {
      props: { mode: 'edit', user: regularUser },
      target
    });
    expect(target.textContent).toContain('editNotice');
    unmount(instance);
  });

  it('does not render edit notice when user is admin', async () => {
    const { default: FormAlerts } = await import('./form-alerts.svelte');
    const target = document.createElement('div');
    const instance = mount(FormAlerts, {
      props: { mode: 'edit', user: adminUser },
      target
    });
    expect(target.textContent).not.toContain('editNotice');
    unmount(instance);
  });

  it('renders add success notice when formSuccess is true in add mode', async () => {
    const { default: FormAlerts } = await import('./form-alerts.svelte');
    const target = document.createElement('div');
    const instance = mount(FormAlerts, {
      props: { formSuccess: true, mode: 'add', user: adminUser },
      target
    });
    expect(target.textContent).toContain('addSuccessNotice');
    unmount(instance);
  });

  it('renders edit success notice when formSuccess is true in edit mode', async () => {
    const { default: FormAlerts } = await import('./form-alerts.svelte');
    const target = document.createElement('div');
    const instance = mount(FormAlerts, {
      props: { formSuccess: true, mode: 'edit', user: adminUser },
      target
    });
    expect(target.textContent).toContain('editSuccessNotice');
    unmount(instance);
  });

  it('renders error alert when formHasErrors is true', async () => {
    const { default: FormAlerts } = await import('./form-alerts.svelte');
    const target = document.createElement('div');
    const instance = mount(FormAlerts, {
      props: { formHasErrors: true, formSuccess: false, mode: 'add', user: adminUser },
      target
    });
    expect(target.textContent).toContain('formErrors');
    unmount(instance);
  });
});
