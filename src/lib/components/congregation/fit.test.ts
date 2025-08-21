/// <reference types="vitest" />

import { render, screen, within } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import type { FitRecord } from '$lib/pocketbase.d';

import { m } from '$lib/paraglide/messages';

import Fit from './fit.svelte';

describe('Fit component', () => {
	it('renders header', () => {
		render(Fit, { fit: {} as FitRecord });
		expect(screen.getByText(m.fit())).toBeInTheDocument();
	});

	it('renders public statement item when flag set', () => {
		const fit = { publicStatement: true } as unknown as FitRecord;
		render(Fit, { fit });
		const list = screen.getByRole('list');
		expect(within(list).getByText(m.fit_publicStatement())).toBeInTheDocument();
	});

	it('renders clergy member items when flags set', () => {
		const fit = { clergyMember: true, multipleClergyMembers: true } as unknown as FitRecord;
		render(Fit, { fit });
		const list = screen.getByRole('list');
		expect(within(list).getByText(m.fit_clergyMember())).toBeInTheDocument();
		expect(within(list).getByText(m.fit_multipleClergyMembers())).toBeInTheDocument();
	});

	it('renders otherText when provided', () => {
		const fit = { other: true, otherText: 'Extra fit details' } as unknown as FitRecord;
		render(Fit, { fit });
		const list = screen.getByRole('list');
		expect(within(list).getByText('Extra fit details')).toBeInTheDocument();
	});
});
