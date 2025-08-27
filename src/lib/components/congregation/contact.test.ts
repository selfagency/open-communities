/// <reference types="vitest" />

import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';

import Contact from './contact.svelte';

describe('Contact component', () => {
  it('renders label', () => {
    render(Contact, {});
    expect(screen.getByText(m.contact())).toBeInTheDocument();
  });

  it('renders mailto link with name when both email and name are provided', () => {
    const props = { contactEmail: 'test@example.com', contactName: 'Bob' };
    render(Contact, props);

    const link = screen.getByRole('link') as HTMLAnchorElement;
    expect(link).toBeInTheDocument();
    expect(link.href).toContain('mailto:test@example.com');
    expect(link).toHaveTextContent('Bob');
  });

  it('renders mailto link with email when only email is provided', () => {
    const props = { contactEmail: 'solo@example.com' };
    render(Contact, props);

    const link = screen.getByRole('link') as HTMLAnchorElement;
    expect(link).toBeInTheDocument();
    expect(link.href).toContain('mailto:solo@example.com');
    expect(link).toHaveTextContent('solo@example.com');
  });

  it('renders name when only name is provided', () => {
    render(Contact, { contactName: 'Alice' });
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
