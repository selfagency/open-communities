import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';

import Footer from './footer.svelte';

describe('Footer component', () => {
  it('renders main links with correct hrefs', () => {
    render(Footer);

    const contact = screen.getByRole('link', { name: new RegExp(m.contact_contactUs(), 'i') });
    expect(contact).toHaveAttribute('href', '/contact');

    const privacy = screen.getByRole('link', { name: new RegExp(m.privacyPolicy(), 'i') });
    expect(privacy).toHaveAttribute('href', '/privacy');

    const terms = screen.getByRole('link', { name: new RegExp(m.termsOfService(), 'i') });
    expect(terms).toHaveAttribute('href', '/terms');

    const siteCredits = screen.getByRole('link', { name: new RegExp(m.siteCredits(), 'i') });
    expect(siteCredits).toHaveAttribute('href', '/site-credits');
  });

  it('renders external credit and rabbis logo link', () => {
    render(Footer);

    // in test env messages return keys; match the home_credit key instead of literal text
    // biome-ignore lint/performance/useTopLevelRegex: intentional inline regex
    const credit = screen.getByRole('link', { name: /home_credit/i });
    expect(credit).toHaveAttribute('href', 'https://self.agency');
    expect(credit).toHaveAttribute('target', '_blank');

    // biome-ignore lint/performance/useTopLevelRegex: intentional inline regex
    const rabbis = screen.getByRole('link', { name: /home_author/i });
    expect(rabbis).toHaveAttribute('href', 'https://rabbis4ceasefire.com/');
  });
});
