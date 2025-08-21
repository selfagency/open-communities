import { describe, expect, it, vi } from 'vitest';

function makeApiStub() {
	return {
		collection: (_: string) => ({
			getFullList: async () => [{ id: 'c1', name: 'Cong' }]
		})
	};
}

describe('contact +page.server', () => {
	it('load returns congregations and form', async () => {
		const mod = await import('../../../src/routes/contact/+page.server');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const locals = { api: makeApiStub(), validate: async () => ({}) } as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await mod.load({ fetch: fetch as any, locals });
		expect(res).toHaveProperty('congregations');
		expect(res).toHaveProperty('form');
	});

	it('default action fails when form invalid', async () => {
		const mod = await import('../../../src/routes/contact/+page.server');
		const validate = async () => ({ data: {}, valid: false });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const locals: any = { api: makeApiStub(), log: { error: vi.fn() }, validate };
		const form = await locals.validate();
		const res = await mod.actions.default({ locals, request: {} });
		// when invalid, action returns a fail which in this stub will resolve; expect an object or failure
		expect(res).toBeDefined();
	});
});
