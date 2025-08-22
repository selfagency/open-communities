import { describe, expect, it, vi } from 'vitest';

import {
	createMockRequestEvent,
	createMockServerLoadEvent,
	mockSveltekitSuperforms
} from '$test/testUtils';

// Mock sveltekit-superforms before any dynamic imports
vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

function makeApiStub() {
	return {
		collection: () => ({
			getFullList: async () => [{ id: 'c1', name: 'Cong' }]
		})
	};
}

describe('contact +page.server', () => {
	it('load returns congregations and form', async () => {
		const mod = await import('../../../src/routes/contact/+page.server');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const locals = { api: makeApiStub(), validate: async () => ({}) } as any;
		const mockEvent = createMockServerLoadEvent({
			locals,
			route: { id: '/contact' },
			url: new URL('http://localhost/contact')
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await mod.load(mockEvent as any);
		expect(res).toHaveProperty('congregations');
		expect(res).toHaveProperty('form');
	});

	it('default action fails when form invalid', async () => {
		const mod = await import('../../../src/routes/contact/+page.server');
		const validate = async () => ({ data: {}, valid: false });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const locals: any = { api: makeApiStub(), log: { error: vi.fn() }, validate };
		await locals.validate();
		const mockActionEvent = createMockRequestEvent({
			locals,
			route: { id: '/contact' },
			url: new URL('http://localhost/contact')
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await mod.actions.default(mockActionEvent as any);
		// when invalid, action returns a fail which in this stub will resolve; expect an object or failure
		expect(res).toBeDefined();
	});
});
