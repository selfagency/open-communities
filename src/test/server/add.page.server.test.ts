import { beforeEach, describe, expect, it, vi } from 'vitest';

function makeLocals(overrides = {}) {
	const api = {
		authStore: { record: {} },
		collection: (name: string) => ({ getFirstListItem: async () => ({ id: 'page' }) })
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return { api, validate: async () => ({}), ...overrides } as any;
}

describe('routes/add +page.server', () => {
	it('load redirects to login when no client id', async () => {
		const mod = await import('../../../src/routes/add/+page.server');
		const locals = makeLocals({
			api: {
				authStore: { record: null },
				collection: () => ({ getFirstListItem: async () => ({}) })
			}
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await mod.load({ fetch: fetch as any, locals }).catch((e) => e);
	// load should throw (SvelteKit redirect) when no client id
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await expect(mod.load({ fetch: fetch as any, locals })).rejects.toBeDefined();
	});
});
