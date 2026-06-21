import { render, screen } from "@testing-library/svelte";
import "@testing-library/jest-dom/vitest";

import type { SuperFormStub } from "$test/global.d";

import { m } from "$lib/paraglide/messages";
import { state } from "$lib/stores";

import Signup from "./signup.svelte";

describe("Signup component", () => {
	type SuperValidatedStub = {
		data: Record<string, unknown>;
		errors: { _errors?: string[] };
		id: string;
		posted: boolean;
		valid: boolean;
	};

	function makeForm(): SuperFormStub {
		const store = {
			set: (_value: unknown) => {},
			subscribe(fn: (v: unknown) => void) {
				fn({});
				return () => {};
			},
			update: (_fn: (value: unknown) => unknown) => {},
		};
		return {
			allErrors: {},
			capture: () => {},
			constraints: {},
			data: {},
			delay: 0,
			delayed: false,
			enhance: () => ({ destroy: () => {} }),
			errors: {},
			form: {
				set: store.set,
				subscribe: store.subscribe,
				update: store.update,
			},
			formId: "stub",
			id: "stub",
			isTainted: (value: unknown) => false,
			lastSubmit: null,
			lastValid: null,
			message: "",
			options: {},
			posted: false,
			reset: () => {},
			restore: () => {},
			setConstraints: () => {},
			setErrors: () => {},
			setField: () => {},
			setFields: () => {},
			setMessage: () => {},
			setPosted: () => {},
			setValid: () => {},
			submit: () => {},
			submitting: false,
			tainted: false,
			timeout: 0,
			valid: true,
			validate: async () => {},
			validateForm: async () => {},
		};
	}

	it("renders sign up title and form fields", () => {
		const form = makeForm();
		const verify: SuperValidatedStub = {
			data: {},
			errors: { _errors: [] },
			id: "t",
			posted: false,
			valid: true,
		};
		render(Signup, { form: form as any, verify });

		// title (may appear multiple times: title, info, button) — ensure at least one match
		const matches = screen.getAllByText(new RegExp(m.signUp(), "i"));
		expect(matches.length).toBeGreaterThanOrEqual(1);

		// presence of inputs
		expect(document.querySelector('input[autocomplete="name"]')).not.toBeNull();
		expect(
			document.querySelector('input[autocomplete="email"]'),
		).not.toBeNull();
		expect(
			document.querySelector(
				'input[type="password"][autocomplete="new-password"]',
			),
		).not.toBeNull();
	});

	it("shows success message when state.form.success is true", () => {
		state.set({ form: { hasErrors: false, success: true } });
		const form = makeForm();
		const verify: SuperValidatedStub = {
			data: {},
			errors: { _errors: [] },
			id: "t",
			posted: false,
			valid: true,
		};
		render(Signup, { form: form as any, verify });

		expect(
			screen.getByText(new RegExp(m.signUpSuccess(), "i")),
		).toBeInTheDocument();

		// reset
		state.set({ form: { hasErrors: false, success: false } });
	});
});
