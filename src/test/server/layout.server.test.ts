import { describe, expect, it } from 'vitest';

function makeApiStub() {
	return {
		authStore: { record: { id: 'u1', lang: 'en' } },
		collection: (_: string) => ({
			getFullList: async () => [{ id: 'c1', name: 'X' }]
		})
	};
}

const cookies = { get: (k: string) => 'en' };

describe('+layout.server load', () => {
	it('returns countries, lang and user', async () => {
		const mod = await import('../../routes/+layout.server');
		const locals = { api: makeApiStub() } as unknown;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await mod.load({ cookies, locals } as any);
		expect(res).toHaveProperty('countries');
		expect(res).toHaveProperty('lang');
		expect(res).toHaveProperty('user');
		expect(res.lang).toBe('en');
	});
});
