import { render, screen, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';

// make waitForTheElement immediate
vi.mock('wait-for-the-element', () => ({
  waitForTheElement: async () => new Promise((res) => setTimeout(res, 0))
}));

// install a global hook that the runtime superforms stub will call when
// submit is invoked. This avoids per-test module mocking and mirrors how the
// real app provides the helper at runtime.
const submitSpy = vi.fn();
beforeEach(() => {
  // install global hook
  (globalThis as any).__TEST_SUPERFORM_SUBMIT__ = submitSpy;
});
afterEach(() => {
  // clean up global
  (globalThis as any).__TEST_SUPERFORM_SUBMIT__ = undefined;
  submitSpy.mockClear();
});

import Verify from './verify.svelte';

describe('login/verify', () => {
  beforeEach(() => {
    submitSpy.mockClear();
  });

  it('sanity: runtime superForm.submit should call global hook', async () => {
    const mod = await import('$test/stubs/sveltekit-superforms.js');
    const sf = mod.superForm({});
    const el = document.createElement('form');
    sf.submit(el);
    expect(submitSpy).toHaveBeenCalledWith(el);
  });

  it('shows verifying message', () => {
    const superData = {
      data: {},
      errors: {},
      id: 'verify',
      posted: false,
      valid: true
    };
    render(Verify, { data: superData, token: null, verified: false });
    expect(screen.getByText('verifying')).toBeInTheDocument();
  });

  it('renders hidden token form and calls submit when token provided', async () => {
    const token = 'abc123';
    const superData = {
      data: {},
      errors: {},
      id: 'verify',
      posted: false,
      valid: true
    };
    const { container } = render(Verify, {
      data: superData,
      token,
      verified: false
    });

    // the hidden form should be present
    const form = container.querySelector('form#verify');
    expect(form).toBeInstanceOf(HTMLFormElement);

    // wait for onMount logic to run and call submit (guard using observable counter)
    await waitFor(() => expect((globalThis as any).__TEST_SUPERFORM_SUBMIT_CALLS__).toBeGreaterThanOrEqual(1));
  });
});
