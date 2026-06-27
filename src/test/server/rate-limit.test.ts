import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('rateLimitByUser', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('allows first request within window', async () => {
    const { rateLimitByUser } = await import('$lib/server/rate-limit');
    expect(rateLimitByUser('user-1')).toBe(true);
  });

  it('allows up to maxRequests within the window', async () => {
    const { rateLimitByUser } = await import('$lib/server/rate-limit');
    const max = 5;
    for (let i = 0; i < max; i++) {
      expect(rateLimitByUser('user-1', max)).toBe(true);
    }
  });

  it('throws 429 when limit is exceeded within the window', async () => {
    const { rateLimitByUser } = await import('$lib/server/rate-limit');
    const max = 3;

    // Consume all tokens
    for (let i = 0; i < max; i++) {
      rateLimitByUser('user-1', max);
    }

    // Next call should throw 429
    try {
      rateLimitByUser('user-1', max);
      expect.unreachable('Expected rate limit error to be thrown');
    } catch (e: unknown) {
      const err = e as { status: number; body: { message: string } };
      expect(err.status).toBe(429);
      expect(err.body.message).toBe('Too many requests — try again later');
    }
  });

  it('refills tokens after window expires', async () => {
    const { rateLimitByUser } = await import('$lib/server/rate-limit');
    const max = 2;
    const windowMs = 60_000;

    // Exhaust tokens in first window
    rateLimitByUser('user-1', max, windowMs);
    rateLimitByUser('user-1', max, windowMs);
    expect(() => rateLimitByUser('user-1', max, windowMs)).toThrow();

    // Advance time past window
    vi.advanceTimersByTime(windowMs);

    // Should be allowed again
    expect(rateLimitByUser('user-1', max, windowMs)).toBe(true);
  });
});
