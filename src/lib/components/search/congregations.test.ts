import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';

import type { CongregationMetaRecord } from '$lib/pocketbase.d';

import { FakeSearch, setSearchTermsSpy, toggleLocationSpy } from '$test/stubs/fake-search';

// make radashi.sleep immediate while keeping other utilities
vi.mock('radashi', () => {
	return {
		alphabetical: vi.fn((arr, fn) =>
			[...arr].sort((a, b) => {
				const aVal = fn ? fn(a) : a;
				const bVal = fn ? fn(b) : b;
				return String(aVal).localeCompare(String(bVal));
			})
		),
		assign: vi.fn((target, ...sources) => Object.assign({}, target, ...sources)),
		isArray: vi.fn((val) => Array.isArray(val)),
		isEmpty: vi.fn((val) => {
			if (val == null) return true;
			if (Array.isArray(val)) return val.length === 0;
			if (typeof val === 'object') return Object.keys(val).length === 0;
			return false;
		}),
		omit: vi.fn((obj, keys) => {
			const result = { ...obj };
			keys.forEach((key) => delete result[key]);
			return result;
		}),
		shake: vi.fn((obj) => {
			const result = {};
			for (const [key, value] of Object.entries(obj)) {
				if (value != null && value !== '' && value !== false) {
					result[key] = value;
				}
			}
			return result;
		}),
		sleep: vi.fn(() => Promise.resolve()),
		unique: vi.fn((arr) => [...new Set(arr)])
	};
});

// We will mock $lib/search to return instances of our FakeSearch
vi.mock('$lib/search', () => ({ Search: FakeSearch }));

// Minimal Location service mock
vi.mock('$lib/location', () => ({ Location: class {} }));

import { m } from '$lib/paraglide/messages';

// Don't import the component at top-level because it constructs a Search
// instance on module evaluation. We'll import it dynamically inside each
// test after `wireFakeSearch()` runs so the component's Search instance
// uses our wired prototype stubs.

// Test-local reactive values that our FakeSearch instances will report
let currentResults: CongregationMetaRecord[] = [];

function wireFakeSearch() {
	// Provide a shared RESULTS_STORE instance on the FakeSearch class so all
	// component-created FakeSearch instances use the same store and observe our
	// `currentResults` test variable.
	const subscribers: Array<(v: CongregationMetaRecord[]) => void> = [];
	const RESULTS_STORE = {
		get: () => currentResults,
		lc: 0,
		listen: vi.fn(),
		notify: (v: CongregationMetaRecord[]) => {
			currentResults = v;
			subscribers.forEach((s) => s(currentResults));
		},
		off: vi.fn(),
		set: (v: CongregationMetaRecord[]) => {
			currentResults = v;
			subscribers.forEach((s) => s(currentResults));
		},
		subscribe: (fn: (v: CongregationMetaRecord[]) => void) => {
			subscribers.push(fn);
			fn(currentResults);
			return () => {
				const i = subscribers.indexOf(fn);
				if (i !== -1) subscribers.splice(i, 1);
			};
		},
		value: currentResults as CongregationMetaRecord[]
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(FakeSearch as any).RESULTS_STORE = RESULTS_STORE;
	// Use the FakeSearch class's default `state` implementation (it provides
	// a test-friendly subscribe/get/value) so we avoid mismatched shapes.
	// If tests need to override state later, mutate `stateValue` and notify
	// via the FakeSearch.prototype.state.notify when implemented.
}

beforeEach(() => {
	// signal components to skip artificial delays during tests
	(globalThis as Record<string, unknown>).__TEST__ = true;
	currentResults = [];
	setSearchTermsSpy.mockClear();
	toggleLocationSpy.mockClear();
	wireFakeSearch();
});

it('shows loading then renders search input', async () => {
	const { default: Congregations } = await import('./congregations.svelte');
	const { findByPlaceholderText } = render(Congregations);
	// after onMount finishes sleep resolves immediately, input should appear
	const input = await findByPlaceholderText(m.search());
	expect(input).toBeInTheDocument();
});

it('shows nothing found when results empty', async () => {
	currentResults = [];
	const { default: Congregations } = await import('./congregations.svelte');
	const { findByText } = render(Congregations);
	const el = await findByText(m.nothingFound());
	expect(el).toBeInTheDocument();
});

it('renders congregation cards when results present', async () => {
	currentResults = [
		{
			country: { name: '' },
			id: 'a',
			location: {
				city: { id: 'cA', name: 'A' },
				country: { id: 'coA', name: '' },
				state: { id: 'sA', name: '' }
			},
			name: 'A',
			services: { onlineOnly: false }
		} as unknown as CongregationMetaRecord & { id: string },
		{
			country: { name: '' },
			id: 'b',
			location: {
				city: { id: 'cB', name: 'B' },
				country: { id: 'coB', name: '' },
				state: { id: 'sB', name: '' }
			},
			name: 'B',
			services: { onlineOnly: false }
		} as unknown as CongregationMetaRecord & { id: string }
	];
	const { default: Congregations } = await import('./congregations.svelte');
	const { getAllByText } = render(Congregations);
	// ensure the shared fake search store notifies the component of currentResults
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(FakeSearch as any).RESULTS_STORE?.notify?.(currentResults);
	// CongregationCard renders name; use a flexible matcher in case text is
	// split across nodes in the card markup. Use waitFor + synchronous query
	// to avoid timing issues caused by transitions.
	await waitFor(() => {
		const nodes = getAllByText((content) => content.includes('A'));
		expect(nodes.length).toBeGreaterThanOrEqual(1);
	});
});

it('clear button clears search and calls setSearchTerms', async () => {
	const { default: Congregations } = await import('./congregations.svelte');
	const { findByPlaceholderText, findByText } = render(Congregations);
	const input = await findByPlaceholderText(m.search());
	await fireEvent.input(input, { target: { value: 'foo' } });
	const clearBtn = await findByText(m.clear());
	await fireEvent.click(clearBtn);
	expect(setSearchTermsSpy).toHaveBeenCalled();
});
