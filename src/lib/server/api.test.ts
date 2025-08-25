import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoist-safe mocks before importing the module under test
vi.mock('pocketbase', () => {
	// each instance gets its own spies
	return {
		default: function MockPocketBase(_url: string) {
			// @ts-expect-error - we're creating a test double
			this.autoCancellation = vi.fn();
			// authStore with spies and mutable isValid
			// @ts-expect-error authstore mock
			this.authStore = {
				clear: vi.fn(),
				isValid: false,
				loadFromCookie: vi.fn()
			};
			// collection returns an object with authRefresh spy
			// @ts-expect-error collection mock
			this.collection = vi.fn((name: string) => ({ authRefresh: vi.fn() }));
		}
	};
});

vi.mock('./logger', () => ({ log: { error: vi.fn() } }));

// Mock the SvelteKit error helper to return a plain object we can assert on
vi.mock('@sveltejs/kit', () => ({
	error: (status: number, message: string) => ({ message, status })
}));

import type { Cookies } from '@sveltejs/kit';

import { api, authenticate, cleanResponse, expand, handleError, loadUser } from './api';
import { log } from './logger';

describe('src/lib/server/api', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('authenticate', () => {
		it('loads cookie and refreshes when authStore.isValid is true', async () => {
			// arrange
			// authStore.isValid is readonly in types; cast through unknown to set in tests
			(api.authStore as unknown as { isValid: boolean }).isValid = true;
			const authRefreshSpy = vi.fn(() => Promise.resolve());
			// replace collection to return our spy
			(
				api as unknown as { collection: (s: string) => { authRefresh: () => Promise<unknown> } }
			).collection = vi.fn(() => ({ authRefresh: authRefreshSpy }));

			// act
			const returned = await authenticate('the-cookie');

			// assert
			expect(api.authStore.loadFromCookie).toHaveBeenCalledWith('the-cookie');
			expect(api.collection).toHaveBeenCalledWith('users');
			expect(authRefreshSpy).toHaveBeenCalled();
			expect(returned).toBe(api);
		});

		it('clears authStore when refresh throws', async () => {
			(api.authStore as unknown as { isValid: boolean }).isValid = true;
			const authRefreshSpy = vi.fn(() => Promise.reject(new Error('boom')));
			(
				api as unknown as { collection: (s: string) => { authRefresh: () => Promise<unknown> } }
			).collection = vi.fn(() => ({ authRefresh: authRefreshSpy }));

			const returned = await authenticate('x');

			expect(api.authStore.loadFromCookie).toHaveBeenCalledWith('x');
			// should have attempted refresh and then cleared on error
			expect(authRefreshSpy).toHaveBeenCalled();
			expect(api.authStore.clear).toHaveBeenCalled();
			expect(returned).toBe(api);
		});

		it('does nothing when no auth and isValid is false', async () => {
			(api.authStore as unknown as { isValid: boolean }).isValid = false;
			// reset spies
			api.authStore.loadFromCookie = vi.fn();
			(
				api as unknown as { collection: (s: string) => { authRefresh: () => Promise<unknown> } }
			).collection = vi.fn(() => ({ authRefresh: vi.fn(() => Promise.resolve()) }));

			const returned = await authenticate('');

			expect(api.authStore.loadFromCookie).not.toHaveBeenCalled();
			expect(api.collection).not.toHaveBeenCalled();
			expect(returned).toBe(api);
		});
	});

	describe('handleError', () => {
		it('rethrows when status is 303', () => {
			const err = { message: 'redirect', status: 303 } as unknown as {
				message: string;
				status: number;
			};
			try {
				// function is expected to throw the passed object
				handleError(err);
				throw new Error('did-not-throw');
			} catch (e) {
				expect(e).toBe(err);
			}
		});

		const cases = [
			['bad request', 400],
			['unauthorized', 401],
			['forbidden', 403],
			["wasn't found", 404],
			['unexpected', 500],
			['unavailable', 503]
		] as const;

		cases.forEach(([msg, expected]) => {
			it(`maps message containing "${msg}" to status ${expected}`, () => {
				const err = { message: `This is ${msg}` } as unknown as { message: string };
				const out = handleError(err);
				expect(out).toEqual({ message: `This is ${msg}`, status: expected });
				// logger.error should have been called with 'load' and the original error
				expect(log.error).toHaveBeenCalledWith('load', err);
			});
		});
	});

	describe('loadUser', () => {
		it('returns empty object when cookie missing', () => {
			const cookies = {
				delete: () => undefined,
				get: () => undefined,
				getAll: () => [],
				serialize: () => '',
				set: () => undefined
			} as unknown as Cookies;
			const u = loadUser(cookies);
			expect(u).toEqual({});
		});

		it('returns empty object when pb_auth missing', () => {
			const cookies = {
				delete: () => undefined,
				get: () => 'foo=bar',
				getAll: () => [],
				serialize: () => '',
				set: () => undefined
			} as unknown as Cookies;
			const u = loadUser(cookies);
			expect(u).toEqual({});
		});

		it('parses pb_auth and returns the model', () => {
			const model = { email: 'me@example.com', id: 'u1', name: 'hi' };
			const pb = JSON.stringify({ model });
			const cookies = {
				delete: () => undefined,
				get: () => `pb_auth=${pb}`,
				getAll: () => [],
				serialize: () => '',
				set: () => undefined
			} as unknown as Cookies;
			const u = loadUser(cookies);
			expect(u).toEqual(model);
		});
	});

	it('re-exports cleanResponse and expand', () => {
		expect(typeof cleanResponse).toBe('function');
		expect(typeof expand).toBe('function');
	});
});
