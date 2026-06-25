import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { getUserStore } from '$test/testUtils';

describe('Menu component (anonymous)', () => {
  it('shows add and login when no user', async () => {
    // ensure no user before importing the component
    const userStore = getUserStore() as { set: (value: unknown) => void };
    userStore.set(null);
    const { default: Menu } = await import('./menu.svelte');
    render(Menu);

    // biome-ignore lint/performance/useTopLevelRegex: intentional inline regex
    expect(screen.getByText(/login|Login/i)).toBeInTheDocument();
    // biome-ignore lint/performance/useTopLevelRegex: intentional inline regex
    expect(screen.getByText(/add|Add/i)).toBeInTheDocument();
  });
});
