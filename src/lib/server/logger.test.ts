import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoist-safe mocks
vi.mock('$lib/utils', () => {
	const rootError = vi.fn();
	const requestInfo = vi.fn();
	const requestError = vi.fn();

	const rootLogger = {
		error: rootError,
		getSubLogger: () => ({ error: requestError, info: requestInfo })
	};

	return {
		logger: {
			getSubLogger: () => rootLogger
		}
	};
});

vi.mock('radashi', () => ({
	shake: (v: unknown) => v,
	uid: () => 'staticid'
}));

vi.mock('$env/dynamic/public', () => ({ PUBLIC_HOSTNAME: 'http://localhost:4173' }));
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

		const requestLogger = logger.getSubLogger().getSubLogger();
		expect(requestLogger.info).toHaveBeenCalledWith(
			'request',
			expect.objectContaining({ referer: '/some/path', status: 200 })
		);
	});

	it('uses pathname when referer hostname matches PUBLIC_HOSTNAME', async () => {
		const event = {
			locals: { startTimer: Date.now() - 50 },
			request: { headers: { get: () => 'https://example.com/outer/path' }, method: 'POST' },
			url: new URL('https://example.com/posted')
		} as unknown as Parameters<typeof logEvent>[1];

		await logEvent(201, event);

		const requestLogger = logger.getSubLogger().getSubLogger();
		expect(requestLogger.info).toHaveBeenCalledWith(
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

		const requestLogger = logger.getSubLogger().getSubLogger();
		expect(requestLogger.info).toHaveBeenCalledWith(
			'request',
			expect.objectContaining({ referer: null, status: 204 })
		);
	});

	it('calls error when locals.error exists', async () => {
		const event = {
			locals: { error: new Error('boom'), startTimer: Date.now() - 20 },
			request: { headers: { get: () => null }, method: 'GET' },
			url: new URL('https://example.com/err')
		} as unknown as Parameters<typeof logEvent>[1];

		await logEvent(500, event);

		const requestLogger = logger.getSubLogger().getSubLogger();
		expect(requestLogger.error).toHaveBeenCalledWith(
			'request',
			expect.objectContaining({ error: expect.any(Error), status: 500 })
		);
	});
});
