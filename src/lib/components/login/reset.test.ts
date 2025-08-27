import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';

import Reset from './reset.svelte';

describe('Reset component', () => {
  // match expected shape used in tests
  type SuperStub = {
    data: Record<string, unknown>;
    errors: Record<string, string[]>;
    id: string;
    posted: boolean;
    valid: boolean;
  };

  it('shows password fields when token is provided', () => {
    const valid: SuperStub = { data: {}, errors: {}, id: 't', posted: false, valid: true };
    render(Reset, { data: valid, reset: false, sent: false, token: 'abc' });

    // inputs for new password and confirm should be present with appropriate autocomplete/type
    const newPwd = document.querySelector('input[autocomplete="new-password"]');
    expect(newPwd).not.toBeNull();

    const confirmPwd = document.querySelector('input[type="password"][autocomplete="new-password"]');
    expect(confirmPwd).not.toBeNull();

    // reset button text comes from messages stub
    expect(screen.getByText(new RegExp(m.resetPassword(), 'i'))).toBeInTheDocument();
  });

  it('shows email field and send button when no token', () => {
    const valid: SuperStub = { data: {}, errors: {}, id: 't', posted: false, valid: true };
    render(Reset, { data: valid, reset: false, sent: false, token: null });

    // notice paragraph should render
    expect(screen.getByText(new RegExp(m.resetNotice(), 'i'))).toBeInTheDocument();

    // email input present
    const email = document.querySelector('input[autocomplete="email"]');
    expect(email).not.toBeNull();

    // send button text
    expect(screen.getByText(new RegExp(m.sendResetEmail(), 'i'))).toBeInTheDocument();
  });
});
