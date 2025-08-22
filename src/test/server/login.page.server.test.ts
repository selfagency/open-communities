import { describe, expect, it } from 'vitest';

function makeApiStub() {
	return {
		authStore: { exportToCookie: () => 'cookie' },
		collection: (name: string) => ({
			authWithPassword: async () => ({ record: { email: 'a@b', id: 'u1' } }),
			requestVerification: async () => ({})
		})
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;
}

describe('login +page.server', () => {
	it('load provides forms', async () => {
		const mod = await import('../../../src/routes/login/+page.server');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const locals = { validate: async () => ({}) } as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await mod.load({ locals } as any);
		expect(res).toHaveProperty('login');
		expect(res).toHaveProperty('reset');
		expect(res).toHaveProperty('signup');
		expect(res).toHaveProperty('verify');
	});

	it('logout action clears cookies', async () => {
		const mod = await import('../../../src/routes/login/+page.server');
		const cookies = {
			delete: () => {},
			get: () => '',
			getAll: () => ({}),
			serialize: () => ({}),
			set: () => {}
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const locals = { api: { authStore: { clear: () => {} } }, cookieOpts: {} } as any;
		const res = await mod.actions.logout({ cookies, locals });
		expect(res).toEqual({});
	});
});
