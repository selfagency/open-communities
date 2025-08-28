import { beforeEach, describe, expect, it, vi } from 'vitest';

type FormErrors = { set: (...args: unknown[]) => unknown };

type FormOptions = {
  [k: string]: unknown;
  onError?: (args: unknown) => unknown;
  onResult?: () => unknown;
  onSubmit?: () => unknown;
  onUpdate?: (args: unknown) => Promise<unknown> | unknown;
};
type FormReturn = { data: unknown; errors: FormErrors; options: unknown };
type SuperFormMockShape = ((data: unknown, opts: unknown) => FormReturn) & {
  lastOptions?: FormOptions;
  mock: { results: Array<{ value: FormReturn }> };
};

// Hoist-safe mocks
vi.mock('sveltekit-superforms', () => {
  const superForm = ((data: unknown, opts: unknown) => {
    (superForm as unknown as SuperFormMockShape).lastOptions = opts as FormOptions;
    const errors: FormErrors = { set: vi.fn() };
    const ret = { data, errors, options: opts } as FormReturn;
    (superForm as unknown as SuperFormMockShape).mock.results.push({ value: ret });
    return ret;
  }) as unknown as SuperFormMockShape;
  (superForm as unknown as SuperFormMockShape).mock = { results: [] };
  return { superForm };
});

vi.mock('svelte-sonner', () => {
  const toast = { error: vi.fn(), success: vi.fn() };
  return { toast };
});

vi.mock('$lib/stores', () => {
  const setState = vi.fn();
  return { setState };
});

vi.mock('$lib/paraglide/messages', () => ({ m: { signUpFailure: () => 'boom' } }));

vi.mock('$lib/utils', () => ({ log: { error: vi.fn() } }));

// Make isEmpty behave predictably
vi.mock('radashi', () => ({
  isEmpty: (v: unknown) => v == null || (typeof v === 'object' && Object.keys(v as object).length === 0)
}));

// Import mocked symbols and module under test
const { superForm: superFormMock } = await import('sveltekit-superforms');
const { toast } = await import('svelte-sonner');
const { setState } = await import('$lib/stores');
const { m } = await import('$lib/paraglide/messages');
const { log } = await import('$lib/utils');

import { initForm } from './signup';

beforeEach(() => {
  vi.clearAllMocks();
  (superFormMock as unknown as SuperFormMockShape).lastOptions = undefined;
  (superFormMock as unknown as SuperFormMockShape).mock = { results: [] };
});

describe('signup initForm', () => {
  it('sets loading state on submit and clears on result', () => {
    initForm({});
    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    expect(opts).toBeDefined();

    opts.onSubmit?.();
    expect(setState).toHaveBeenCalledWith({ loadingSecondary: true });

    opts.onResult?.();
    expect(setState).toHaveBeenCalledWith({ loadingSecondary: false });
  });

  it('onError logs and toasts error message', () => {
    initForm({});
    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    const err = { error: { message: 'boom' } };

    opts.onError?.({ result: err });

    expect(log.error).toHaveBeenCalledWith('submission error', err.error.message);
    expect(toast.error).toHaveBeenCalledWith(err.error.message);
  });

  it('onUpdate success sets form success true', async () => {
    initForm({});
    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;

    await opts.onUpdate?.({ result: { type: 'success' } });

    expect(setState).toHaveBeenCalledWith({ form: { hasErrors: false, success: true } });
  });

  it('onUpdate failure sets errors, logs and toasts signUpFailure', async () => {
    initForm({});
    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;

    const result = {
      data: {
        form: { errors: { field: 'invalid' } }
      },
      type: 'failure'
    } as const;

    await opts.onUpdate?.({ result });

    expect(setState).toHaveBeenCalled();
    // Ensure logging and toast were triggered for failure
    expect(log.error).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(m.signUpFailure());
  });
});
