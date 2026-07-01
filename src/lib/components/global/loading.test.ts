import { render } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { assertAccessible } from '$test/accesslint';

import Loading from './loading.svelte';

describe('Loading component', () => {
  it('renders the spinner by default', () => {
    render(Loading);
    // icon renders as an svg with role img or accessible name depending on stub; query for svg
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('applies full variant class', () => {
    const { container } = render(Loading, { variant: 'full' });
    const root = container.firstElementChild as HTMLElement | null;
    expect(root).toBeTruthy();
    const cls = root?.className || '';
    // class directive compiles to a class containing min-h-...; assert presence of that prefix
    expect(cls).toContain('min-h-');
  });

  it('has no accessibility violations', () => {
    const { container } = render(Loading);
    assertAccessible(container);
  });
});
