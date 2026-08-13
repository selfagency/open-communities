import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

import { makeMockFormProps } from '$test/testUtils';

describe('ProfileForm', () => {
  it('renders profile card with form fields', async () => {
    const { default: ProfileForm } = await import('./profile-form.svelte');
    const target = document.createElement('div');
    const instance = mount(ProfileForm, {
      props: {
        saved: false,
        ...makeMockFormProps({
          email: 'test@example.com',
          lang: 'en',
          name: 'Test User',
          notifications: true
        })
      },
      target
    });
    expect(target.textContent).toContain('profile');
    expect(target.textContent).toContain('saveChanges');
    expect(target.querySelector('input')).toBeTruthy();
    unmount(instance);
  });

  it('shows saved = true state', async () => {
    const { default: ProfileForm } = await import('./profile-form.svelte');
    const target = document.createElement('div');
    const instance = mount(ProfileForm, {
      props: {
        saved: true,
        ...makeMockFormProps({
          email: 'test@example.com',
          lang: 'en',
          name: 'Test User',
          notifications: true
        })
      },
      target
    });
    expect(target.textContent).toContain('updateSuccess');
    unmount(instance);
  });
});
