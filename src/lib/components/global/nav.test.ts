import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { state } from '$lib/stores';

// Tests for responsive Nav wrapper that chooses Sheet (mobile) or Menu (desktop)

describe('Nav component', () => {
  it('renders Sheet trigger when offsetWidth < 420 (mobile)', async () => {
    // set the shared state store to a mobile width before rendering
    state.set({ isMobile: true, offsetWidth: 360 });
    const { default: Nav } = await import('./nav.svelte');
    render(Nav);

    // Mobile layout: Sheet.Trigger includes an sr-only label with the menu key — assert that specific button exists
    const trigger = screen.getByRole('button', { name: /menu/i });
    expect(trigger).toBeInTheDocument();
  });

  it('renders Menu (desktop) when offsetWidth >= 420', async () => {
    state.set({ isMobile: false, offsetWidth: 1024 });
    const { default: Nav } = await import('./nav.svelte');
    render(Nav);

    // Desktop layout should not render the Sheet Trigger (button named 'menu')
    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
  });
});
