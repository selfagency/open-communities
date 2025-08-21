import { describe, expect, it } from 'vitest';

function makeApiStub() {
	return {
		authStore: { record: {} },
		collection: (_: string) => ({
			getFirstListItem: async () => ({ body: 'x', id: 'p1' }),
			getFullList: async () => [],
			getOne: async () => ({ id: 'o1' })
		})
	};
}

const fetchStub = async () => ({ json: async () => ({}), ok: true });

describe('server route modules smoke tests', () => {
	it('root load returns expected keys', async () => {
		const mod = await import('../../routes/+page.server');
		const locals = { api: makeApiStub() };
		const args = { fetch: fetchStub, locals } as { fetch: unknown; locals: unknown };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await mod.load(args as any);
		expect(result).toHaveProperty('congregations');
		expect(result).toHaveProperty('content');
	});

	it('privacy/terms/site-credits loads content', async () => {
		const p = await import('../../routes/privacy/+page.server');
		const t = await import('../../routes/terms/+page.server');
		const s = await import('../../routes/site-credits/+page.server');
		const locals = { api: makeApiStub() };
		const args2 = { fetch: fetchStub, locals } as { fetch: unknown; locals: unknown };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const r1 = await p.load(args2 as any);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const r2 = await t.load(args2 as any);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const r3 = await s.load(args2 as any);
		expect(r1).toHaveProperty('content');
		expect(r2).toHaveProperty('content');
		expect(r3).toHaveProperty('content');
	});

	it('logout action clears cookies', async () => {
		const mod = await import('../../routes/logout/+page.server');
		const cookies = { set: () => {} };
		const locals = { api: { authStore: { clear: () => {} } }, cookieOpts: {} };
		const res = await mod.actions.logout({ cookies, locals });
		expect(res).toEqual({});
	});
});
