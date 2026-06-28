import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('DangerZone', () => {
  it('renders danger section with delete button', async () => {
    const { default: DangerZone } = await import('./danger-zone.svelte');
    const target = document.createElement('div');
    const instance = mount(DangerZone, { target });
    expect(target.textContent).toContain('dangerZone');
    expect(target.textContent).toContain('deleteAccount');
    expect(target.textContent).toContain('deleteAccountDescription');
    unmount(instance);
  });
});
