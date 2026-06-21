import { render, screen, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { setState } from '$lib/stores';

describe('Progress component', () => {
  it('is hidden by default and shows when loading starts', async () => {
    setState({ loading: false });

    const { default: Progress } = await import('./progress.svelte');

    render(Progress);

    // initially not visible
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    // toggle loading to true -> should show progress
    setState({ loading: true });

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('finishes and hides after loading stops', async () => {
    setState({ loading: true });
    const { default: Progress } = await import('./progress.svelte');
    render(Progress);

    // should appear
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();

    // stop loading -> progress should finish and hide within a short timeout
    setState({ loading: false });

    // wait for the element to be removed from the document
    await waitFor(
      () => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
