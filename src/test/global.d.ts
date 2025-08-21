/// <reference types="vitest" />

// Ensure jest-dom matchers are available to TypeScript in test files
// Use the Vitest-specific integration so matchers are registered against
// Vitest's `expect` before test files execute.
import '@testing-library/jest-dom/vitest';
import type { Readable, Writable } from 'svelte';
import type { SuperFormErrors, SuperFormSnapshot, SuperFormValidated } from 'sveltekit-superforms';

declare global {
	// allow importing this file for side-effects
	namespace NodeJS {}
}

// Stub type matching SuperForm<any> structure
export type SuperFormStub = {
	allErrors: Readable<{ path: string }>;
	capture: () => SuperFormSnapshot;
	constraints: Writable<unknown>;
	data: Record<string, unknown>;
	delay: number;
	delayed: Readable<boolean>;
	enhance: () => { destroy: () => void };
	errors: SuperFormErrors<unknown>;
	form: {
		set: (value: unknown) => void;
		subscribe: (fn: (v: unknown) => void) => () => void;
		update: (fn: (value: unknown) => unknown) => void;
	};
	formId: Writable<string>;
	id: string;
	isTainted: (value: unknown) => boolean;
	lastSubmit: unknown;
	lastValid: unknown;
	message: Writable<unknown>;
	options: Partial<Record<string, unknown>>;
	posted: Readable<boolean>;
	reset: () => void;
	restore: () => void;
	setConstraints: (constraints: unknown) => void;
	setErrors: (errors: unknown) => void;
	setField: (name: string, value: unknown) => void;
	setFields: (fields: Record<string, unknown>) => void;
	setMessage: (message: unknown) => void;
	setPosted: (posted: boolean) => void;
	setValid: (valid: boolean) => void;
	submit: () => void;
	submitting: Readable<boolean>;
	tainted: Writable<unknown>;
	timeout: Readable<boolean>;
	valid: boolean;
	validate: () => Promise<SuperFormValidated>;
	validateForm: () => Promise<SuperFormValidated>;
};

// Provide a module declaration so `import { superForm } from 'sveltekit-superforms'`
// and `import type { SuperForm } from 'sveltekit-superforms'` resolve in tests.
declare module 'sveltekit-superforms' {
	export function superForm(initialData?: Record<string, unknown>): SuperFormStub;
	const _default: { superForm: typeof superForm };
	export default _default;
}
