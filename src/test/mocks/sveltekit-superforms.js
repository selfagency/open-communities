export const superForm = () => ({
	allErrors: () => [],
	capture: () => {},
	constraints: {},
	delayed: { subscribe: () => {} },
	enhance: () => {},
	errors: { subscribe: () => {} },
	form: { subscribe: () => {} },
	isTainted: () => false,
	message: { subscribe: () => {} },
	posted: { subscribe: () => {} },
	reset: () => {},
	restore: () => {},
	submit: () => {},
	submitting: { subscribe: () => {} },
	timeout: { subscribe: () => {} },
	validate: () => {},
	validateField: () => {}
});

export const setError = () => {};
export default {};
