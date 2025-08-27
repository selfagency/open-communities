// Stub type matching SuperForm<any> structure
type SuperFormStub = {
  constraints: unknown;
  enhance: () => void;
  errors: unknown;
  form: { subscribe: (fn: (v: unknown) => void) => () => void };
  formId: string;
  message: unknown;
  posted: boolean;
  reset: () => void;
  setConstraints: (constraints: unknown) => void;
  setErrors: (errors: unknown) => void;
  setField: (name: string, value: unknown) => void;
  setFields: (fields: Record<string, unknown>) => void;
  setMessage: (message: unknown) => void;
  setPosted: (posted: boolean) => void;
  setValid: (valid: boolean) => void;
  submit: () => void;
  valid: boolean;
  validate: () => void;
};
