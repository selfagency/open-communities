import { fireEvent, render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';
import { setState } from '$lib/stores';

import Index from './index.svelte';

describe('Login index component', () => {
  // minimal shape matching the parts of SuperValidated used by the component/tests
  interface SuperStub {
    data: Record<string, unknown>;
    errors: Record<string, string[]>; // match ValidationErrors<any> type
    id: string;
    posted: boolean;
    valid: boolean;
  }
  it('renders the login title by default', () => {
    const valid: SuperStub = { data: {}, errors: {}, id: 'test', posted: false, valid: true };
    render(Index, { data: valid, reset: valid });

    const matches = screen.getAllByText(new RegExp(m.login(), 'i'));
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('toggles to reset view when clicking forgot password', async () => {
    const valid: SuperStub = { data: {}, errors: {}, id: 'test', posted: false, valid: true };
    render(Index, { data: valid, reset: valid });

    const forgot = screen.getByText(new RegExp(m.forgotPassword(), 'i'));
    await fireEvent.click(forgot);

    // after clicking, the card title should show resetPassword key
    const matches = screen.getAllByText(new RegExp(m.resetPassword(), 'i'));
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading when loadingSecondary is true', async () => {
    // set loading secondary to true
    setState({ loadingSecondary: true });
    const valid: SuperStub = { data: {}, errors: {}, id: 'test', posted: false, valid: true };
    render(Index, { data: valid, reset: valid });

    // loading component renders a spinner svg with class animate-spin
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();

    // reset state back
    setState({ loadingSecondary: false });
  });
});
