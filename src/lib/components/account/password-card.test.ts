import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

import { makeMockFormProps } from '$test/testUtils';

describe('PasswordCard', () => {
  it('renders password change form with all fields', async () => {
    const { default: PasswordCard } = await import('./password-card.svelte');
    const target = document.createElement('div');
    const instance = mount(PasswordCard, {
      props: {
        ...makeMockFormProps()
      },
      target
    });
    expect(target.textContent).toContain('changePassword');
    expect(target.querySelector('input')).toBeTruthy();
    unmount(instance);
  });
});
