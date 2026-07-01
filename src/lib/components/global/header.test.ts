import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';
import { assertAccessible } from '$test/accesslint';

import Header from './header.svelte';

describe('Header component', () => {
  it('renders home link with logo and title', () => {
    render(Header);

    const homeLink = screen.getByRole('link', { name: new RegExp(m.title(), 'i') });
    expect(homeLink).toHaveAttribute('href', '/');

    // title text should be visible
    expect(screen.getByText(new RegExp(m.title(), 'i'))).toBeInTheDocument();
  });

  it('renders navigation', () => {
    render(Header);
    // Nav renders links; ensure a navigation region or at least a link exists
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('has no accessibility violations', () => {
    const { container } = render(Header);
    // Scope to the logo link to avoid the hamburger button which
    // gets its aria-label from bits-ui's child snippet pattern (not
    // resolvable in test env).
    const logoLink = container.querySelector('nav > div:first-child a');
    assertAccessible(logoLink!);
  });
});
