/* region imports */
import type { Cookies } from '@sveltejs/kit';

import { error } from '@sveltejs/kit';
import cookie from 'cookie';
import PocketBase from 'pocketbase';

import type { TypedPocketBase, UsersRecord } from '$lib/types.d';

import { PUBLIC_API_ENDPOINT } from '$env/static/public';
import { cleanResponse, expand } from '$lib/api';

import { log } from './logger';
/* endregion imports */

// instantiate pocketbase api service
const api = new PocketBase(PUBLIC_API_ENDPOINT) as TypedPocketBase;
api.autoCancellation(false);

async function authenticate(auth: string) {
	try {
		if (auth) api.authStore.loadFromCookie(auth);
		if (api.authStore.isValid) {
			await api.collection('users').authRefresh();
		}
	} catch {
		api.authStore.clear();
	}

	return api;
}

// error handler
function handleError(err) {
	const message = err.message || 'An unexpected error occurred.';
	let status = 500;

	if (err.status === 303) {
		throw err;
	}

	const mlc = message.toLowerCase();
	if (mlc.includes('bad request')) status = 400;
	if (mlc.includes('unauthorized')) status = 401;
	if (mlc.includes('forbidden')) status = 403;
	if (mlc.includes("wasn't found")) status = 404;
	if (mlc.includes('unexpected')) status = 500;
	if (mlc.includes('unavailable')) status = 503;

	log.error('Error:', err);
	return error(status, message);
}

function loadUser(cookies: Cookies): UsersRecord {
	const auth = cookies.get('auth');
	if (!auth) return {} as UsersRecord;
	const parsed = cookie.parse(auth);
	if (!parsed.pb_auth) return {} as UsersRecord;
	return JSON.parse(parsed.pb_auth).model;
}

export { api, authenticate, cleanResponse, expand, handleError, loadUser };
