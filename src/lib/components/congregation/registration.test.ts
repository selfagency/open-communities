/// <reference types="vitest" />

import { render, screen } from '@testing-library/svelte';
import { m } from '$lib/paraglide/messages';
import type { RegistrationRecord } from '$lib/pocketbase.d';
import { assertAccessible } from '$test/accesslint';
import '@testing-library/jest-dom/vitest';

import Registration from './registration.svelte';

describe('Registration component', () => {
  it('renders header', () => {
    render(Registration, {});
    expect(screen.getByText(m.registration())).toBeInTheDocument();
  });

  it('renders fixed price text when registrationType is fixedPrice', () => {
    const registration = { registrationType: 'fixedPrice' } as unknown as RegistrationRecord;
    render(Registration, { registration });
    expect(screen.getByText(m.registration_fixedPrice())).toBeInTheDocument();
  });

  it('renders otherText when registrationType is other', () => {
    const registration = {
      otherText: 'Register at the door',
      registrationType: 'other'
    } as unknown as RegistrationRecord;
    render(Registration, { registration });
    expect(screen.getByText('Register at the door')).toBeInTheDocument();
  });

  it('renders unspecified when registrationType not recognised', () => {
    const registration = { registrationType: 'weird' } as unknown as RegistrationRecord;
    render(Registration, { registration });
    expect(screen.getByText(m.unspecified())).toBeInTheDocument();
  });

  it('renders email and website buttons when provided', () => {
    const registration = {
      email: 'r@test.com',
      url: 'https://example.com'
    } as unknown as RegistrationRecord;
    render(Registration, { registration });

    // buttons render as links
    const links = screen.getAllByRole('link');
    expect(links.some((l) => (l as HTMLAnchorElement).href.includes('mailto:r@test.com'))).toBe(true);
    expect(links.some((l) => (l as HTMLAnchorElement).href.includes('https://example.com'))).toBe(true);
    expect(screen.getByText(m.email())).toBeInTheDocument();
    expect(screen.getByText(m.website())).toBeInTheDocument();
  });

  it('has no accessibility violations', () => {
    const { container } = render(Registration, {});
    assertAccessible(container);
  });
});
