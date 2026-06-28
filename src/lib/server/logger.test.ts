// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoist-safe mocks
vi.mock('$lib/utils', () => {
  const rootInfo = vi.fn();
  const rootError = vi.fn();

  const rootLogger = {
    error: rootError,
    getSubLogger: () => rootLogger,
    info: rootInfo
  };

  return {
    logger: rootLogger
  };
});

vi.mock('radashi', () => ({
  shake: (v: unknown) => v,
  uid: () => 'staticid'
}));

vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_HOSTNAME: 'http://localhost:4173' }
}));
vi.mock('$app/environment', () => ({ dev: false }));

import { logger } from '$lib/utils';

import { logEvent } from './logger';

describe('server/logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses pathname when referer is localhost', async () => {
    const event = {
      locals: { startTimer: Date.now() - 120 },
      request: { headers: { get: () => 'http://localhost/some/path' }, method: 'GET' },
      url: new URL('https://example.com/hello')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(200, event);

    expect(logger.info).toHaveBeenCalledWith(
      'request',
      expect.objectContaining({ referer: '/some/path', status: 200 })
    );
  });

  it('uses pathname when referer hostname matches PUBLIC_HOSTNAME', async () => {
    const event = {
      locals: { startTimer: Date.now() - 50 },
      request: { headers: { get: () => 'http://localhost:4173/outer/path' }, method: 'POST' },
      url: new URL('http://localhost:4173/posted')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(201, event);

    expect(logger.info).toHaveBeenCalledWith(
      'request',
      expect.objectContaining({ method: 'POST', referer: '/outer/path', status: 201 })
    );
  });

  it('sets referer to null when header missing', async () => {
    const event = {
      locals: { startTimer: Date.now() - 20 },
      request: { headers: { get: () => null }, method: 'GET' },
      url: new URL('https://example.com/none')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(204, event);

    expect(logger.info).toHaveBeenCalledWith('request', expect.objectContaining({ referer: null, status: 204 }));
  });

  it('calls error when locals.error exists', async () => {
    const event = {
      locals: { error: new Error('boom'), startTimer: Date.now() - 20 },
      request: { headers: { get: () => null }, method: 'GET' },
      url: new URL('https://example.com/err')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(500, event);

    expect(logger.error).toHaveBeenCalledWith(
      'request',
      expect.objectContaining({ error: expect.any(Error), status: 500 })
    );
  });

  it('skips logging for internal requests (_app/ path)', async () => {
    const event = {
      locals: { startTimer: Date.now() - 10 },
      request: { headers: { get: () => null }, method: 'GET' },
      url: new URL('https://example.com/_app/immutable/chunk.js')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(200, event);

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('skips logging for __data.json requests', async () => {
    const event = {
      locals: { startTimer: Date.now() - 10 },
      request: { headers: { get: () => null }, method: 'GET' },
      url: new URL('https://example.com/foo/__data.json')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(200, event);

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('skips logging for .js and .css requests', async () => {
    const event = {
      locals: { startTimer: Date.now() - 10 },
      request: { headers: { get: () => null }, method: 'GET' },
      url: new URL('https://example.com/bundle.js')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(200, event);

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('skips logging for favicon requests', async () => {
    const event = {
      locals: { startTimer: Date.now() - 10 },
      request: { headers: { get: () => null }, method: 'GET' },
      url: new URL('https://example.com/favicon.ico')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(200, event);

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('sets referer to null when referer URL is invalid', async () => {
    const event = {
      locals: { startTimer: Date.now() - 20 },
      request: { headers: { get: (h: string) => (h === 'referer' ? 'not-a-valid-url' : null) }, method: 'GET' },
      url: new URL('https://example.com/path')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(200, event);

    expect(logger.info).toHaveBeenCalledWith('request', expect.objectContaining({ referer: null, status: 200 }));
  });

  it('includes errorId and errorStackTrace when present', async () => {
    const event = {
      locals: {
        error: new Error('detailed'),
        errorId: 'err-123',
        errorStackTrace: 'at line 42',
        startTimer: Date.now() - 20
      },
      request: { headers: { get: () => null }, method: 'GET' },
      url: new URL('https://example.com/detail')
    } as unknown as Parameters<typeof logEvent>[1];

    await logEvent(500, event);

    expect(logger.error).toHaveBeenCalledWith(
      'request',
      expect.objectContaining({ errorId: 'err-123', errorStackTrace: 'at line 42' })
    );
  });
});
