import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';

import Footer from './footer.svelte';

describe('Footer component', () => {
  it('renders site credits link with correct href', () => {
    render(Footer);

    const siteCredits = screen.getByRole('link', { name: new RegExp(m.siteCredits(), 'i') });
    expect(siteCredits).toHaveAttribute('href', '/site-credits');
  });

  it('renders external credit and rabbis logo link', () => {
    render(Footer);

    // in test env messages return keys; match the home_credit key instead of literal text
    // biome-ignore lint/performance/useTopLevelRegex: inline regex in test
    const credit = screen.getByRole('link', { name: /home_credit/i });
    expect(credit).toHaveAttribute('href', 'https://self.agency');
    expect(credit).toHaveAttribute('target', '_blank');

    // biome-ignore lint/performance/useTopLevelRegex: inline regex in test
    const rabbis = screen.getByRole('link', { name: /home_author/i });
    expect(rabbis).toHaveAttribute('href', 'https://rabbis4ceasefire.com/');
  });
});
