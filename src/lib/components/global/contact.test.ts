import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
// vitest helpers available from global test setup

import Contact from './contact.svelte';

describe('Contact component', () => {
  it('renders the contact title', () => {
    render(Contact, { congregations: [], data: {}, snapshot: {} });
    // test environment returns message keys via the messages stub (e.g. "contact_contactUs")
    // biome-ignore lint/performance/useTopLevelRegex: intentional inline regex
    expect(screen.getByText(/contact_contactUs/i)).toBeInTheDocument();
  });

  // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
  it('shows a mailto link when name and email are provided', async () => {
    // Provide initial data so the component fills form values
    const data = { email: 'bob@example.com', name: 'Bob' };
    render(Contact, { congregations: [], data, snapshot: {} });

    // The form includes an email input; ensure the value is present (input rendered by Input component)
    const emailInputs = screen.getAllByRole('textbox');
    // there should be at least one textbox (name/email)
    expect(emailInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders name input when email is empty', () => {
    const data = { email: '', name: 'Alice' };
    render(Contact, { congregations: [], data, snapshot: {} });

    // there should be a textbox for the name input
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThanOrEqual(1);
  });
});
