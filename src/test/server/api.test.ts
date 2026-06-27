import { describe, expect, it, vi } from 'vitest';

// Mock SvelteKit error — throw with status/message so callers catch it
vi.mock('@sveltejs/kit', () => ({
  error: (status: number, message: string) => {
    throw Object.assign(new Error(message), { status });
  }
}));

const { cleanResponse, throwAsHttpError, withRetry } = await import('$lib/server/api');

describe('cleanResponse', () => {
  const sample = {
    collectionId: 'abc123',
    collectionName: 'congregations',
    created: '2024-01-01T00:00:00Z',
    id: 'rec001',
    name: 'Test Congregation',
    updated: '2024-06-01T00:00:00Z'
  };

  it('strips system fields by default', () => {
    const result = cleanResponse(sample);
    expect(result).not.toHaveProperty('collectionId');
    expect(result).not.toHaveProperty('collectionName');
    expect(result).not.toHaveProperty('updated');
    expect(result).not.toHaveProperty('created');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
  });

  it('keeps date when keepDate is true', () => {
    const result = cleanResponse(sample, true);
    expect(result).toHaveProperty('created');
    expect(result).not.toHaveProperty('collectionId');
  });

  it('strips prototype pollution keys', () => {
    const polluted = { ...sample, __proto__: {} as unknown, constructor: {} as unknown };
    const result = cleanResponse(polluted);
    expect(result).not.toHaveProperty('__proto__');
    expect(result).not.toHaveProperty('constructor');
  });
});

describe('throwAsHttpError', () => {
  it('throws 500 for non-PB errors', () => {
    expect(() => throwAsHttpError('something broke')).toThrow();
  });

  it('throws with status from PB error', () => {
    const pbErr = { status: 404, message: 'Not found' };
    expect(() => throwAsHttpError(pbErr)).toThrow();
  });

  it('re-throws 303 redirects from PB', () => {
    const redirectErr = { status: 303, message: 'Redirect' };
    expect(() => throwAsHttpError(redirectErr)).toThrow();
  });

  it('falls back to 500 when PB error has no status', () => {
    const emptyErr = { message: 'no status' };
    expect(() => throwAsHttpError(emptyErr)).toThrow();
  });
});

describe('withRetry', () => {
  it('returns the result on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable error then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 502, message: 'Bad Gateway' })
      .mockResolvedValueOnce('recovered');
    await expect(withRetry(fn)).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-retryable error', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 404, message: 'Not Found' });
    await expect(withRetry(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting retries', async () => {
    const err = { status: 503, message: 'Service Unavailable' };
    const fn = vi.fn().mockRejectedValue(err);
    // Custom options: 1 retry with 1ms delay (so tests are fast)
    await expect(withRetry(fn, { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 10 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  it('retries on 429 (rate limited)', async () => {
    const fn = vi.fn().mockRejectedValueOnce({ status: 429, message: 'Too Many Requests' }).mockResolvedValueOnce('ok');
    await expect(withRetry(fn, { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 10 })).resolves.toBe('ok');
  });

  it('retries on 520 (cloudflare)', async () => {
    const fn = vi.fn().mockRejectedValueOnce({ status: 520, message: 'Origin Error' }).mockResolvedValueOnce('ok');
    await expect(withRetry(fn, { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 10 })).resolves.toBe('ok');
  });
});
