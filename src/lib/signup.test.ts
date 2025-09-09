import { beforeEach, describe, expect, it, vi } from 'vitest';

type FormOptions = {
  [k: string]: unknown;
  onError?: (args: unknown) => unknown;
  onResult?: () => unknown;
  onSubmit?: () => unknown;
  onUpdate?: (args: unknown) => Promise<unknown> | unknown;
};
type FormReturn = { data: unknown; errors: unknown; options: unknown };
type SuperFormMockShape = ((data: unknown, opts: unknown) => FormReturn) & {
  lastOptions?: FormOptions;
  mock: { results: Array<{ value: FormReturn }> };
};

// Mock external dependencies before importing the module under test
vi.mock('sveltekit-superforms', () => {
  const superForm = ((data: unknown, opts: unknown) => {
    (superForm as unknown as SuperFormMockShape).lastOptions = opts as FormOptions;
    const ret = { data, errors: {}, options: opts } as FormReturn;
    (superFormMock as unknown as SuperFormMockShape).mock.results.push({ value: ret });
    return ret;
  }) as unknown as SuperFormMockShape;
  (superForm as unknown as SuperFormMockShape).mock = { results: [] };
  return { superForm };
});

vi.mock('svelte-sonner', () => {
  const toast = { error: vi.fn(), success: vi.fn() };
  return { toast };
});

vi.mock('$lib/paraglide/messages', () => {
  const m = {
    signUpFailure: () => 'signup-failure-message'
  };
  return { m };
});

vi.mock('$lib/stores', () => {
  const setState = vi.fn();
  return { setState };
});

vi.mock('$lib/utils', () => {
  const log = { error: vi.fn() };
  return { log };
});

// Make isEmpty return false for non-empty and true for empty-ish values
vi.mock('radashi', () => ({
  isEmpty: (v: unknown) => {
    return v == null || (typeof v === 'object' && Object.keys(v as object).length === 0);
  }
}));

// Grab mocked exports so tests can assert on them
const { superForm: superFormMock } = await import('sveltekit-superforms');
const { toast } = await import('svelte-sonner');
const { m } = await import('$lib/paraglide/messages');
const { setState } = await import('$lib/stores');
const { log } = await import('$lib/utils');

import { initForm } from './signup';

beforeEach(() => {
  vi.clearAllMocks();
  (superFormMock as unknown as SuperFormMockShape).lastOptions = undefined;
  (superFormMock as unknown as SuperFormMockShape).mock = { results: [] };
});

describe('initForm', () => {
  it('creates a superForm with correct configuration', () => {
    const testData = { email: 'test@example.com', password: 'password123' };
    const form = initForm(testData);

    expect(form).toBeDefined();
    // Check that superForm was called with the correct data
    expect((superFormMock as unknown as SuperFormMockShape).mock.results[0].value.data).toBe(testData);

    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    expect(opts).toBeDefined();
    expect(opts.id).toBe('signup');
    expect(opts.dataType).toBe('json');
    expect(typeof opts.onError).toBe('function');
    expect(typeof opts.onResult).toBe('function');
    expect(typeof opts.onSubmit).toBe('function');
    expect(typeof opts.onUpdate).toBe('function');
  });

  it('onSubmit sets loading state', () => {
    initForm({});

    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    opts.onSubmit?.();

    expect(setState).toHaveBeenCalledWith({ loadingSecondary: true });
  });

  it('onResult clears loading state', () => {
    initForm({});

    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    opts.onResult?.();

    expect(setState).toHaveBeenCalledWith({ loadingSecondary: false });
  });

  it('onError handles server errors', () => {
    initForm({});

    const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
    const mockResult = { error: { message: 'Server error' } };
    opts.onError?.({ result: mockResult });

    expect(log.error).toHaveBeenCalledWith('submission error', 'Server error');
    expect(toast.error).toHaveBeenCalledWith('signup-failure-message');
  });

  describe('onUpdate callback', () => {
    it('handles success result', async () => {
      initForm({});

      const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
      const mockResult = { type: 'success' };
      await opts.onUpdate?.({ result: mockResult });

      expect(setState).toHaveBeenCalledWith({
        form: { hasErrors: false, success: false },
        loadingSecondary: false
      });
      expect(setState).toHaveBeenCalledWith({
        form: { hasErrors: false, success: true }
      });
    });

    it('handles failure result with form errors', async () => {
      initForm({});

      const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
      const mockResult = {
        data: {
          form: {
            errors: { email: 'Invalid email' }
          }
        },
        status: 400,
        type: 'failure'
      };
      await opts.onUpdate?.({ result: mockResult });

      expect(setState).toHaveBeenCalledWith({
        form: { hasErrors: false, success: false },
        loadingSecondary: false
      });
      expect(setState).toHaveBeenCalledWith({
        form: { hasErrors: true, success: false }
      });
      expect(log.error).toHaveBeenCalledWith('signup form validation failed', {
        data: mockResult.data,
        status: 400,
        type: 'failure'
      });
      expect(log.error).toHaveBeenCalledWith('form field errors', { email: 'Invalid email' });
      expect(toast.error).toHaveBeenCalledWith('signup-failure-message');
    });

    it('handles failure result with server error message', async () => {
      initForm({});

      const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
      const mockResult = {
        data: {
          form: {
            error: 'Custom server error',
            errors: {}
          }
        },
        status: 400,
        type: 'failure'
      };
      await opts.onUpdate?.({ result: mockResult });

      expect(log.error).toHaveBeenCalledWith('server error message', 'Custom server error');
      expect(toast.error).toHaveBeenCalledWith('Custom server error');
    });

    it('handles failure result with no specific errors', async () => {
      initForm({});

      const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
      const mockResult = {
        data: {
          form: {}
        },
        status: 400,
        type: 'failure'
      };
      await opts.onUpdate?.({ result: mockResult });

      expect(toast.error).toHaveBeenCalledWith('signup-failure-message');
    });

    it('handles unexpected result types', async () => {
      initForm({});

      const opts = (superFormMock as unknown as SuperFormMockShape).lastOptions as FormOptions;
      const mockResult = { type: 'redirect' };
      await opts.onUpdate?.({ result: mockResult });

      expect(log.error).toHaveBeenCalledWith('unexpected result type', mockResult);
    });
  });
});
