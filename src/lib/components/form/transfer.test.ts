import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Transfer form component', () => {
	it('renders without crashing', async () => {
		const { default: Component } = await import('./transfer.svelte');
		const props = makeMockFormProps({}, {});
		const target = document.createElement('div');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		new (Component as any)({ props, target });
		expect(target).toBeTruthy();
	});
});
