// Provide setError for tests that import it directly
// increment an observable counter too
globalThis.__TEST_SUPERFORM_SUBMIT_CALLS__ = (globalThis.__TEST_SUPERFORM_SUBMIT_CALLS__ || 0) + 1;
// Minimal sveltekit-superforms stub for tests

export function superForm(initialData = {}) {
  // ensure form data has the same defaults the real component expects
  const defaults = {
    captcha: '',
    email: '',
    message: '',
    name: '',
    reason: 'question',
    record: ''
  };
  // a tiny writable store implementation used as $formData in components
  let value = { ...defaults, ...initialData };
  const subscribers = new Set();

  const store = {
    set(next) {
      value = next;
      for (const s of subscribers) s(value);
    },
    subscribe(fn) {
      subscribers.add(fn);
      fn(value);
      return () => subscribers.delete(fn);
    },
    update(updater) {
      value = updater(value);
      for (const s of subscribers) s(value);
    }
  };

  return {
    capture: () => ({}),
    constraints: {},
    enhance: () => {},
    errors: {},
    form: store,
    formId: 'test-form',
    message: '',
    restore: () => ({}),
    setConstraints: () => {},
    setErrors: () => {},
    setMessage: () => {},
    submit: (el) => {
      // If a test installs a spy on globalThis, call it so tests can assert.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (globalThis.__TEST_SUPERFORM_SUBMIT__) globalThis.__TEST_SUPERFORM_SUBMIT__(el);
      // increment an observable counter too
      globalThis.__TEST_SUPERFORM_SUBMIT_CALLS__ = (globalThis.__TEST_SUPERFORM_SUBMIT_CALLS__ || 0) + 1;
    }
  };
}

// no-op in test environment
export default { superForm };
