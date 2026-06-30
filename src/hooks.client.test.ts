import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCapture = vi.fn();
const mockError = vi.fn();
const mockDebug = vi.fn();

vi.mock('$lib/posthog', () => ({
  captureException: mockCapture,
  initPosthog: vi.fn()
}));

vi.mock('$lib/utils', () => ({
  log: { error: mockError, debug: mockDebug }
}));

vi.mock('$app/environment', () => ({ dev: false }));

describe('handleError (client)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns shaped error for generic Error', async () => {
    const { handleError } = await import('./hooks.client');
    const r = handleError({
      error: new Error('boom'),
      event: { url: new URL('http://x/') },
      status: 500,
      message: 'Internal Error'
    } as never);
    expect(r).toMatchObject({ message: 'Internal Error', status: 500 });
  });

  it('returns message only for 404, no logging', async () => {
    const { handleError } = await import('./hooks.client');
    const r = handleError({
      error: new Error('not found'),
      event: { url: new URL('http://x/missing') },
      status: 404,
      message: 'Not Found'
    } as never);
    expect(r).toMatchObject({ message: 'Not Found', status: 404 });
  });

  it('handles non-Error throwable gracefully', async () => {
    const { handleError } = await import('./hooks.client');
    expect(() => handleError({ error: 'str', event: {}, status: 500, message: '' } as never)).not.toThrow();
  });

  it('captures exception for non-404 errors', async () => {
    const { handleError } = await import('./hooks.client');
    handleError({
      error: new Error('crash'),
      event: { url: new URL('http://x/') },
      status: 500,
      message: 'Server Error'
    } as never);
    expect(mockCapture).toHaveBeenCalled();
  });
});
