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

  it('has no accessibility violations', () => {
    const { container } = render(Welcome);
    assertAccessible(container);
  });
});
