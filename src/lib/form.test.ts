import { beforeEach, describe, expect, it, vi } from 'vitest';

interface FormErrors {
  set: (...args: unknown[]) => unknown;
}

interface FormOptions {
  onError?: (args: unknown) => unknown;
  onResult?: () => unknown;
  onSubmit?: () => unknown;
  onUpdate?: (args: unknown) => Promise<unknown> | unknown;
  [k: string]: unknown;
}
interface FormReturn {
  data: unknown;
  errors: FormErrors;
  options: unknown;
}
type SuperFormMockShape = ((data: unknown, opts: unknown) => FormReturn) & {
  lastOptions?: FormOptions;
  mock: { results: Array<{ value: FormReturn }> };
};

// Mock external dependencies before importing the module under test
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

vi.mock('$app/navigation', () => {
  const goto = vi.fn();
  return { goto };
});

vi.mock('$lib/paraglide/messages', () => {
  const m = {
    addFailure: () => 'add-failure',
    addSuccess: () => 'add-success',
    editFailure: () => 'edit-failure',
    editSuccess: () => 'edit-success'
  };
  return { m };
});

vi.mock('$lib/stores', () => {
  const setState = vi.fn();
  return { setState };
});

vi.mock('./utils', () => {
  const log = { error: vi.fn() };
  return { log };
});

// Make isEmpty return false for non-empty and true for empty-ish values
vi.mock('radashi', () => ({
  isEmpty: (v: unknown) => v == null || (typeof v === 'object' && Object.keys(v as object).length === 0)
}));

// Grab mocked exports so tests can assert on them
const { superForm: superFormMock } = await import('sveltekit-superforms');
const { toast } = await import('svelte-sonner');
const { goto } = await import('$app/navigation');
const { m } = await import('$lib/paraglide/messages');
const { setState } = await import('$lib/stores');
const { log } = await import('./utils');

import { initForm } from './form';

beforeEach(() => {
  vi.clearAllMocks();
  (superFormMock as unknown as SuperFormMockShape).lastOptions = undefined;
  (superFormMock as unknown as SuperFormMockShape).mock = { results: [] };
});

describe('initForm', () => {
  it('wires onSubmit and onResult to set loading state', () => {
    initForm({ foo: 'bar' }, 'add', false);

    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    expect(opts).toBeDefined();

    opts.onSubmit?.();
    expect(setState).toHaveBeenCalledWith({ loadingSecondary: true });

    opts.onResult?.();
    expect(setState).toHaveBeenCalledWith({ loadingSecondary: false });
  });

  it('onError logs and sets error state and shows toast', () => {
    initForm({}, 'add', false);
    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    const err = { error: { message: 'boom' } };

    opts.onError?.({ result: err });

    expect(setState).toHaveBeenCalledWith({
      form: { hasErrors: true, success: false },
      loadingSecondary: false
    });
    expect(log.error).toHaveBeenCalledWith(err.error.message);
    expect(toast.error).toHaveBeenCalledWith(err.error.message);
  });

  it('onUpdate success navigates for admin and sets success for non-admin', async () => {
    // admin case
    initForm({}, 'edit', true);
    let opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    await opts.onUpdate?.({ result: { type: 'success' } });
    expect(toast.success).toHaveBeenCalledWith(m.editSuccess());
    expect(goto).toHaveBeenCalledWith('/', { invalidateAll: true });

    vi.clearAllMocks();

    // non-admin case
    initForm({}, 'add', false);
    opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    await opts.onUpdate?.({ result: { type: 'success' } });
    expect(toast.success).toHaveBeenCalledWith(m.addSuccess());
    expect(setState).toHaveBeenCalledWith({ form: { hasErrors: false, success: true } });
  });

  it('onUpdate failure sets errors, logs and shows toast', async () => {
    initForm({}, 'add', false);
    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;

    const result = {
      data: {
        form: { errors: { field: 'invalid' } }
      },
      type: 'error'
    } as const;

    await opts.onUpdate?.({ result });

    expect(setState).toHaveBeenCalled();
    const formReturned = (superFormMock as unknown as SuperFormMockShape).mock.results[0].value;
    expect(formReturned.errors.set).toHaveBeenCalledWith(result.data.form.errors);
    expect(log.error).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(m.addFailure());
  });
});
