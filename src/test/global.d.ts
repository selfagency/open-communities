/* Test globals set by setupTest.ts and used across test files. */

declare global {
  interface GlobalThis {
    __TEST__: boolean | undefined;
    __TEST_SUPERFORM_SUBMIT__: ((...args: unknown[]) => unknown) | undefined;
    __TEST_USER_STORE__:
      | undefined
      | {
          set: (v: unknown) => void;
          subscribe: (fn: (v: unknown) => void) => () => void;
          update: (updater: (v: unknown) => unknown) => void;
        };
  }
}

export type SuperFormStub = {
  allErrors: Record<string, unknown>;
  capture: () => void;
  constraints: Record<string, unknown>;
  data: Record<string, unknown>;
  delay: number;
  delayed: boolean;
  enhance: () => { destroy: () => void };
  errors: Record<string, unknown>;
  form: {
    set: (v: unknown) => void;
    subscribe: (fn: (v: unknown) => void) => () => void;
    update: (fn: (value: unknown) => unknown) => void;
  };
  formId: string;
  id: string;
  isTainted: (value: unknown) => boolean;
  lastSubmit: null;
  lastValid: null;
  message: string;
  options: Record<string, unknown>;
  posted: boolean;
  reset: () => void;
  restore: () => void;
  setConstraints: () => void;
  setErrors: () => void;
  setField: () => void;
  setFields: () => void;
  setMessage: () => void;
  setPosted: () => void;
  setValid: () => void;
  submit: () => void;
  submitting: boolean;
  tainted: boolean;
  timeout: number;
  valid: boolean;
  validate: () => Promise<void>;
  validateForm: () => Promise<void>;
};
