import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Skipped: @testing-library/svelte has a known incompatibility with Svelte 5
// (The $ name is reserved compile error). See AGENTS.md.
describe.skip('Menu component (logged in)', () => {
  // NOSONAR — @testing-library/svelte × Svelte 5 incompatibility
  it('shows edit and logout when user has congregation and email', async () => {
    const fakeSearchParams = { get: () => null, has: () => false };
    const fakeUser = { congregation: 'abc', email: 'bob@example.com' };

    vi.doMock('$app/state', () => {
      const page = {
        data: { user: fakeUser },
        subscribe: (fn: (v: unknown) => void) => {
          fn({ data: { user: fakeUser }, url: { searchParams: fakeSearchParams } });
          // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop
          return () => {};
        },
        url: { searchParams: fakeSearchParams }
      };
      return { page };
    });

    const { default: Menu } = await import('./menu.svelte');
    render(Menu);

    // wait for the DOM to show the logout button
    // biome-ignore lint/performance/useTopLevelRegex: inline regex in test
    const btn = await screen.findByText(/logout|Logout/i);
    expect(btn).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
  });
});
