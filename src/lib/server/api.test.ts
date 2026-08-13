// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoist-safe mocks before importing the module under test
vi.mock('pocketbase', () => {
  function MockPocketBase(this: Record<string, unknown>) {
    this.autoCancellation = vi.fn();
    this.authStore = {
      clear: vi.fn(),
      isValid: false,
      loadFromCookie: vi.fn()
    };
    this.collection = vi.fn((_name: string) => ({ authRefresh: vi.fn() }));
  }
  return { default: MockPocketBase };
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

import { cleanResponse, throwAsHttpError, withRetry } from './api';
import { log } from './logger';

describe('src/lib/server/api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it('does NOT retry on connection refused (status 0)', async () => {
      const fn = vi.fn().mockRejectedValue({ message: 'connection refused', status: 0 });
      await expect(withRetry(fn)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
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
      vi.useFakeTimers();
      const promise = withRetry(fn);
      await vi.advanceTimersByTimeAsync(60_000);
      await expect(promise).rejects.toBe(err);
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries (maxRetries was reduced to 2)
      vi.useRealTimers();
    });

    it('logs a warning on each retry attempt', async () => {
      const fn = vi.fn().mockRejectedValueOnce({ message: 'busy', status: 429 }).mockResolvedValue('ok');
      await expect(withRetry(fn)).resolves.toBe('ok');
      expect(log.warn).toHaveBeenCalledWith(
        expect.stringContaining('PB retry 1/2'),
        expect.objectContaining({ message: 'busy', status: 429 })
      );
    });
  });

  describe('cleanResponse', () => {
    it('removes collectionId, collectionName, updated', () => {
      const result = cleanResponse({
        collectionId: 'abc',
        collectionName: 'congregations',
        id: '123',
        name: 'test',
        updated: '2024-01-01'
      });
      expect(result).toEqual({ id: '123', name: 'test' });
    });

    it('keeps created when keepDate is true', () => {
      const result = cleanResponse(
        {
          collectionId: 'abc',
          collectionName: 'congregations',
          created: '2024-01-01',
          id: '123',
          updated: '2024-01-01'
        },
        true
      );
      expect(result).toEqual({ created: '2024-01-01', id: '123' });
    });

    it('removes created by default', () => {
      const result = cleanResponse({
        collectionId: 'abc',
        collectionName: 'congregations',
        created: '2024-01-01',
        id: '123',
        updated: '2024-01-01'
      });
      expect(result).toEqual({ id: '123' });
    });
  });

  describe('cleanResponse', () => {
    it('removes pocketbase meta fields and preserves numeric 0/1 values', () => {
      const result = cleanResponse({
        active: 0,
        collectionId: 'abc',
        collectionName: 'test',
        created: '2025-01-01',
        name: 'test',
        updated: '2025-01-02',
        visible: 1
      });
      expect(result).toEqual({ active: 0, name: 'test', visible: 1 });
    });

    it('skips __proto__ and constructor keys', () => {
      const result = cleanResponse({ __proto__: 1, constructor: 0, visible: 1 });
      expect(result).toEqual({ visible: 1 });
    });
  });

  describe('isPbError', () => {
    it('returns true for objects with status and message', () => {
      const err = { message: 'not found', status: 404 };
      const out = throwAsHttpError(err);
      expect(out).toEqual({ message: 'not found', status: 404 });
    });

    it('returns false for non-objects', () => {
      const err = 'string error';
      const out = throwAsHttpError(err);
      expect(out).toEqual({ message: 'An unexpected error occurred.', status: 500 });
    });
  });
});
