// @vitest-environment node

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
      this.collection = vi.fn((_name: string) => ({ authRefresh: vi.fn() }));
    }
  };
});

vi.mock('./logger', () => ({ log: { error: vi.fn(), warn: vi.fn() } }));

// Mock dev=true so throwAsHttpError doesn't hide the error message in tests
vi.mock('$app/environment', () => ({
  browser: false,
  dev: true,
  prerendering: false
}));

// Mock the SvelteKit error helper to return a plain object we can assert on
vi.mock('@sveltejs/kit', () => ({
  error: (status: number, message: string) => ({ message, status })
}));

import type { Cookies } from '@sveltejs/kit';

import { api, authenticate, cleanResponse, expand, loadUser, throwAsHttpError, withRetry } from './api';
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
        api as unknown as {
          collection: (s: string) => { authRefresh: () => Promise<unknown> };
        }
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
        api as unknown as {
          collection: (s: string) => { authRefresh: () => Promise<unknown> };
        }
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
        api as unknown as {
          collection: (s: string) => { authRefresh: () => Promise<unknown> };
        }
      ).collection = vi.fn(() => ({
        authRefresh: vi.fn(() => Promise.resolve())
      }));

      const returned = await authenticate('');

      expect(api.authStore.loadFromCookie).not.toHaveBeenCalled();
      expect(api.collection).not.toHaveBeenCalled();
      expect(returned).toBe(api);
    });
  });

  describe('throwAsHttpError', () => {
    it('rethrows when status is 303', () => {
      const err = { message: 'redirect', status: 303 };
      try {
        throwAsHttpError(err);
        throw new Error('did-not-throw');
      } catch (e) {
        expect(e).toBe(err);
      }
    });

    it('uses err.status and err.message when both are present', () => {
      const err = { message: 'Forbidden', status: 403 };
      const out = throwAsHttpError(err);
      expect(out).toEqual({ message: 'Forbidden', status: 403 });
      expect(log.error).toHaveBeenCalledWith('load', err);
    });

    it('returns 500 for errors without a status property', () => {
      const err = { message: 'something went wrong' };
      const out = throwAsHttpError(err);
      expect(out).toEqual({
        message: 'An unexpected error occurred.',
        status: 500
      });
      expect(log.error).toHaveBeenCalledWith('load', err);
    });

    it('falls back to default message when error has no message', () => {
      const err = { status: 500 };
      const out = throwAsHttpError(err);
      expect(out).toEqual({
        message: 'An unexpected error occurred.',
        status: 500
      });
      expect(log.error).toHaveBeenCalledWith('load', err);
    });
  });

  describe('loadUser', () => {
    it('returns null when cookie missing', () => {
      const cookies = {
        delete: () => undefined,
        get: () => undefined,
        getAll: () => [],
        serialize: () => '',
        set: () => undefined
      } as unknown as Cookies;
      const u = loadUser(cookies);
      expect(u).toBeNull();
    });

    it('returns null when pb_auth missing', () => {
      const cookies = {
        delete: () => undefined,
        get: () => 'foo=bar',
        getAll: () => [],
        serialize: () => '',
        set: () => undefined
      } as unknown as Cookies;
      const u = loadUser(cookies);
      expect(u).toBeNull();
    });

    it('returns null on malformed JSON', () => {
      const cookies = {
        delete: () => undefined,
        get: () => 'pb_auth=not-json',
        getAll: () => [],
        serialize: () => '',
        set: () => undefined
      } as unknown as Cookies;
      const u = loadUser(cookies);
      expect(u).toBeNull();
    });

    it('returns null when model lacks required fields', () => {
      const pb = JSON.stringify({ model: { foo: 'bar' } });
      const cookies = {
        delete: () => undefined,
        get: () => `pb_auth=${pb}`,
        getAll: () => [],
        serialize: () => '',
        set: () => undefined
      } as unknown as Cookies;
      const u = loadUser(cookies);
      expect(u).toBeNull();
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

  describe('withRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns the result on success without retrying', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const result = await withRetry(fn);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable status (429) and succeeds', async () => {
      const fn = vi.fn().mockRejectedValueOnce({ message: 'rate limit', status: 429 }).mockResolvedValue('ok');
      const promise = withRetry(fn);
      // advance past the entire retry window
      await vi.runAllTimersAsync();
      const result = await promise;
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on retryable status (0) and succeeds on last attempt', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ message: 'net err', status: 0 })
        .mockRejectedValueOnce({ message: 'net err', status: 0 })
        .mockRejectedValueOnce({ message: 'net err', status: 0 })
        .mockResolvedValue('ok');
      const promise = withRetry(fn);
      await vi.runAllTimersAsync();
      const result = await promise;
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('does NOT retry on non-retryable status (404)', async () => {
      const fn = vi.fn().mockRejectedValue({ message: 'not found', status: 404 });
      await expect(withRetry(fn)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on non-retryable status (403)', async () => {
      const fn = vi.fn().mockRejectedValue({ message: 'forbidden', status: 403 });
      await expect(withRetry(fn)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws after exhausting all retries', async () => {
      const err = { message: 'timeout', status: 524 };
      const fn = vi.fn().mockRejectedValue(err);
      const promise = withRetry(fn);
      await vi.runAllTimersAsync();
      await expect(promise).rejects.toBe(err);
      // initial call + 4 retries
      expect(fn).toHaveBeenCalledTimes(5);
    });

    it('logs a warning on each retry attempt', async () => {
      const fn = vi.fn().mockRejectedValueOnce({ message: 'busy', status: 429 }).mockResolvedValue('ok');
      const promise = withRetry(fn);
      await vi.runAllTimersAsync();
      await promise;
      expect(log.warn).toHaveBeenCalledWith(
        expect.stringContaining('PB retry 1/4'),
        expect.objectContaining({ message: 'busy', status: 429 })
      );
    });
  });

  it('re-exports cleanResponse and expand', () => {
    expect(typeof cleanResponse).toBe('function');
    expect(typeof expand).toBe('function');
  });
});
