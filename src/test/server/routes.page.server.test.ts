import { beforeEach, describe, expect, it } from 'vitest';

function makeApiStub() {
	return {
		authStore: { record: {} },
		collection(name: string) {
			return {
				async getFirstListItem() {
					return { body: 'x', id: 'p1' };
				},
				async getFullList() {
					return [];
				},
				async getOne() {
					return { id: 'o1' };
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any;
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

describe('routes +page.server quick smoke', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let locals: any;

	beforeEach(() => {
		locals = { api: makeApiStub(), validate: async () => ({}) };
	});

	it('root load returns congregations and content', async () => {
		const mod = await import('../../../src/routes/+page.server');

		const res = await mod.load({ fetch, locals });
		expect(res).toHaveProperty('congregations');
		expect(res).toHaveProperty('content');
	});
});
