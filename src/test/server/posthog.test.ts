import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/logger', () => ({
  log: { error: () => {}, debug: () => {}, warn: () => {} }
}));

vi.mock('posthog-node', () => {
  const capture = vi.fn();
  const captureException = vi.fn();
  const flush = vi.fn().mockResolvedValue(undefined);
  const shutdown = vi.fn();
  (globalThis as any).__PH_MOCKS__ = { capture, captureException, flush, shutdown };
  // biome-ignore lint/complexity/useArrowFunction: must be regular function for `new PostHog()`
  const PostHog = function () {
    return { capture, captureException, flush, shutdown };
  };
  return { PostHog };
});

function ph() {
  return (globalThis as any).__PH_MOCKS__ as {
    capture: ReturnType<typeof vi.fn>;
    captureException: ReturnType<typeof vi.fn>;
    flush: ReturnType<typeof vi.fn>;
    shutdown: ReturnType<typeof vi.fn>;
  };
}

describe('server/posthog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('capture does nothing when no key is configured', async () => {
    vi.mocked(await import('$env/dynamic/public')).env.PUBLIC_POSTHOG_KEY = '';
    const { capture } = await import('../../lib/server/posthog');
    await capture('user-1', 'test-event');
    expect(ph().capture).not.toHaveBeenCalled();
  });

  it('capture sends event through PostHog client', async () => {
    const { capture } = await import('../../lib/server/posthog');
    await capture('user-1', 'test-event');
    expect(ph().capture).toHaveBeenCalledWith({ distinctId: 'user-1', event: 'test-event' });
  });

  it('capture uses anonymous distinct id when user is undefined', async () => {
    const { capture } = await import('../../lib/server/posthog');
    await capture(undefined, 'pageview');
    expect(ph().capture).toHaveBeenCalledWith({ distinctId: 'anonymous', event: 'pageview' });
  });

  it('captureException sends error through PostHog client', async () => {
    const { captureException } = await import('../../lib/server/posthog');
    const error = new Error('test error');
    await captureException(error, 'user-1');
    expect(ph().captureException).toHaveBeenCalledWith(error, 'user-1', undefined);
  });

  it('captureException wraps non-Error in Error', async () => {
    const { captureException } = await import('../../lib/server/posthog');
    await captureException('string error', 'user-1');
    expect(ph().captureException).toHaveBeenCalled();
    const call = ph().captureException.mock.calls[0];
    expect(call[0]).toBeInstanceOf(Error);
    expect(call[0].message).toBe('string error');
  });

  it('closePhClient shuts down and nulls the client', async () => {
    const { closePhClient, capture } = await import('../../lib/server/posthog');
    await capture('user', 'ev');
    closePhClient();
    expect(ph().shutdown).toHaveBeenCalled();
  });

  it('captureException does nothing when no key configured', async () => {
    vi.mocked(await import('$env/dynamic/public')).env.PUBLIC_POSTHOG_KEY = '';
    const { captureException } = await import('../../lib/server/posthog');
    await captureException(new Error('test'));
    expect(ph().captureException).not.toHaveBeenCalled();
  });

  it('captureException handles non-Error, non-string objects', async () => {
    const { captureException } = await import('../../lib/server/posthog');
    const obj = { code: 500, detail: 'server error' };
    await captureException(obj, 'user-1');
    expect(ph().captureException).toHaveBeenCalled();
    const call = ph().captureException.mock.calls[0];
    expect(call[0]).toBeInstanceOf(Error);
    expect(call[0].message).toContain('server error');
  });

  it('captureException handles objects that fail JSON.stringify', async () => {
    const { captureException } = await import('../../lib/server/posthog');
    const circular: Record<string, unknown> = { name: 'test' };
    circular.self = circular;
    await captureException(circular, 'user-1');
    expect(ph().captureException).toHaveBeenCalled();
    const call = ph().captureException.mock.calls[0];
    expect(call[0]).toBeInstanceOf(Error);
  });

  it('capture handles PostHog client error gracefully', async () => {
    const { capture } = await import('../../lib/server/posthog');
    // Make the mock capture throw
    ph().capture.mockImplementationOnce(() => {
      throw new Error('ph error');
    });
    // Should not throw — error is caught internally
    await expect(capture('user-1', 'test-event')).resolves.toBeUndefined();
  });

  it('captureException handles PostHog client error gracefully', async () => {
    const { captureException } = await import('../../lib/server/posthog');
    ph().captureException.mockImplementationOnce(() => {
      throw new Error('ph error');
    });
    await expect(captureException(new Error('test'), 'user-1')).resolves.toBeUndefined();
  });
});
