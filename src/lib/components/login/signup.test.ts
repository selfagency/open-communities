import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';
import { setState } from '$lib/stores';
import type { SuperFormStub } from '$test/global.d';

import Signup from './signup.svelte';

describe('Signup component', () => {
  interface SuperValidatedStub {
    data: Record<string, unknown>;
    errors: { _errors?: string[] };
    id: string;
    posted: boolean;
    valid: boolean;
  }

  function makeForm(): SuperFormStub {
    const store = {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      set: (_value: unknown) => {},
      subscribe(fn: (v: unknown) => void) {
        fn({});
        // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
        return () => {};
      },
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      update: (_fn: (value: unknown) => unknown) => {}
    };
    return {
      allErrors: {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      capture: () => {},
      constraints: {},
      data: {},
      delay: 0,
      delayed: false,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      enhance: () => ({ destroy: () => {} }),
      errors: {},
      form: {
        set: store.set,
        subscribe: store.subscribe,
        update: store.update
      },
      formId: 'stub',
      id: 'stub',
      isTainted: (_value: unknown) => false,
      lastSubmit: null,
      lastValid: null,
      message: '',
      options: {},
      posted: false,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      reset: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      restore: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      setConstraints: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      setErrors: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      setField: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      setFields: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      setMessage: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      setPosted: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      setValid: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      submit: () => {},
      submitting: false,
      tainted: false,
      timeout: 0,
      valid: true,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      validate: async () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      validateForm: async () => {}
    };
  }

  it('renders sign up title and form fields', () => {
    const form = makeForm();
    const verify: SuperValidatedStub = {
      data: {},
      errors: { _errors: [] },
      id: 't',
      posted: false,
      valid: true
    };
    render(Signup, { form: form as any, verify });

    // title (may appear multiple times: title, info, button) — ensure at least one match
    const matches = screen.getAllByText(new RegExp(m.signUp(), 'i'));
    expect(matches.length).toBeGreaterThanOrEqual(1);

    // presence of inputs
    expect(document.querySelector('input[autocomplete="name"]')).not.toBeNull();
    expect(document.querySelector('input[autocomplete="email"]')).not.toBeNull();
    expect(document.querySelector('input[type="password"][autocomplete="new-password"]')).not.toBeNull();
  });

  it('shows success message when state.form.success is true', () => {
    setState({ form: { hasErrors: false, success: true } });
    const form = makeForm();
    const verify: SuperValidatedStub = {
      data: {},
      errors: { _errors: [] },
      id: 't',
      posted: false,
      valid: true
    };
    render(Signup, { form: form as any, verify });

    expect(screen.getByText(new RegExp(m.signUpSuccess(), 'i'))).toBeInTheDocument();

    // reset
    setState({ form: { hasErrors: false, success: false } });
  });
});
