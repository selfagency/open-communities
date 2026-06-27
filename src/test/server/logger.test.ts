import type { RequestEvent } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
  browser: false,
  dev: false
}));

vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_HOSTNAME: 'https://example.com' }
}));

// Mock the frontend logger from $lib/utils to avoid tslog side effects
vi.mock('$lib/utils', () => ({
  logger: {
    getSubLogger: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      getSubLogger: vi.fn(),
      info: vi.fn(),
      silly: vi.fn(),
      trace: vi.fn(),
      warn: vi.fn()
    }))
  },
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

function mockRequestEvent(overrides: Record<string, unknown> = {}): RequestEvent {
  const url = new URL((overrides.url as string) || 'http://localhost:5173/admin');
  const headerMap: Record<string, string | undefined> = {
    'user-agent': 'vitest/1.0',
    'x-forwarded-for': '127.0.0.1',
    referer: (overrides.referer as string) || undefined,
    ...((overrides.headerOverrides as Record<string, string | undefined>) || {})
  };
  const entries: [string, string][] = [];
  for (const [k, v] of Object.entries(headerMap)) {
    if (v !== undefined) {
      entries.push([k, v]);
    }
  }
  return {
    url,
    request: {
      headers: {
        get: vi.fn((key: string) => headerMap[key] || null),
        entries: vi.fn().mockReturnValue(entries.values())
      }
    },
    locals: {
      error: overrides.error || undefined,
      errorId: overrides.errorId || undefined,
      errorStackTrace: overrides.errorStackTrace || undefined,
      startTimer: (overrides.startTimer as number) || Date.now()
    },
    params: {},
    route: { id: null },
    isDataRequest: false
  } as unknown as RequestEvent;
}

describe('logEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips internal request to localhost:3000 in production', async () => {
    const { logEvent } = await import('$lib/server/logger');
    const event = mockRequestEvent({ url: 'http://localhost:3000/health' });
    expect(logEvent(200, event)).toBeUndefined();
  });

  it('logs 200 request as info', async () => {
    const { logEvent, log } = await import('$lib/server/logger');
    const infoSpy = vi.spyOn(log, 'info');
    const event = mockRequestEvent({ url: 'http://localhost:5173/api/test' });
    logEvent(200, event);
    expect(infoSpy).toHaveBeenCalledOnce();
  });

  it('skips __data.json requests', async () => {
    const { logEvent } = await import('$lib/server/logger');
    const event = mockRequestEvent({ url: 'http://localhost:5173/admin/__data.json' });
    expect(logEvent(200, event)).toBeUndefined();
  });

  it('skips .js asset requests', async () => {
    const { logEvent } = await import('$lib/server/logger');
    const event = mockRequestEvent({ url: 'http://localhost:5173/_app/immutable/chunk.js' });
    expect(logEvent(200, event)).toBeUndefined();
  });

  it('logs error-level for requests with error', async () => {
    const { logEvent, log } = await import('$lib/server/logger');
    const errorSpy = vi.spyOn(log, 'error');
    const event = mockRequestEvent({
      error: new Error('Test error'),
      errorId: 'err_001',
      errorStackTrace: '  at handle (app.ts:10:5)'
    });
    logEvent(500, event);
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('converts internal referrer to pathname', async () => {
    const { logEvent, log } = await import('$lib/server/logger');
    const infoSpy = vi.spyOn(log, 'info');
    const event = mockRequestEvent({
      url: 'http://localhost:5173/contact',
      referer: 'http://localhost:5173/'
    });
    logEvent(200, event);
    expect(infoSpy).toHaveBeenCalledOnce();
  });

  it('handles invalid referrer URL gracefully', async () => {
    const { logEvent, log } = await import('$lib/server/logger');
    const infoSpy = vi.spyOn(log, 'info');
    const event = mockRequestEvent({
      url: 'http://localhost:5173/some-path',
      referer: 'not a valid url'
    });
    logEvent(200, event);
    expect(infoSpy).toHaveBeenCalledOnce();
  });

  it('handles null referer', async () => {
    const { logEvent, log } = await import('$lib/server/logger');
    const infoSpy = vi.spyOn(log, 'info');
    const event = mockRequestEvent({
      url: 'http://localhost:5173/page',
      headerOverrides: { referer: '' }
    });
    logEvent(200, event);
    expect(infoSpy).toHaveBeenCalledOnce();
  });
});
