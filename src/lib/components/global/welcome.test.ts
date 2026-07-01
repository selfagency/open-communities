import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';
import { assertAccessible } from '$test/accesslint';

import Welcome from './welcome.svelte';

describe('Welcome component', () => {
  it('renders the home blurb message', () => {
    render(Welcome);

    // messages stub returns key names in tests
    expect(screen.getByText(new RegExp(m.home_blurb(), 'i'))).toBeInTheDocument();
  });

  it('renders the decorative SVG assets', () => {
    render(Welcome);

    // the SVG components render inline; assert there's at least one <svg>
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('has no accessibility violations', () => {
    const { container } = render(Welcome);
    assertAccessible(container);
  });
});
