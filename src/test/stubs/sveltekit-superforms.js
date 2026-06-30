// @ts-expect-error — test infrastructure, intentionally loose typing
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
    /** @param {any} next */
    set(next) {
      value = next;
      for (const s of subscribers) {
        s(value);
      }
    },
    /** @param {(v: any) => void} fn */
    subscribe(fn) {
      subscribers.add(fn);
      fn(value);
      return () => subscribers.delete(fn);
    },
    /** @param {(v: any) => any} updater */
    update(updater) {
      value = updater(value);
      for (const s of subscribers) {
        s(value);
      }
    }
  };

  return {
    capture: () => ({}),
    constraints: {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    enhance: () => {},
    errors: {},
    form: store,
    formId: 'test-form',
    message: '',
    restore: () => ({}),
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    setConstraints: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    setErrors: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    setMessage: () => {},
    /** @param {any} el */
    submit: (el) => {
      // @ts-expect-error: globalThis custom test property
      if (globalThis.__TEST_SUPERFORM_SUBMIT__) {
        // @ts-expect-error: globalThis custom test property
        globalThis.__TEST_SUPERFORM_SUBMIT__(el);
      }
      // increment an observable counter too
      // @ts-ignore: globalThis has no index signature in CI TS version
      globalThis.__TEST_SUPERFORM_SUBMIT_CALLS__ = (globalThis.__TEST_SUPERFORM_SUBMIT_CALLS__ || 0) + 1;
    }
  };
}

// no-op in test environment
export default { superForm };
