/* region imports */
import PocketBase from 'pocketbase';
import { assign, omit, isArray } from 'radashi';

import type { TypedPocketBase } from '$lib/types.d';

import { PUBLIC_API_ENDPOINT } from '$env/static/public';
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

function convertBooleans(obj: any): any {
	if (isArray(obj)) {
		return obj.map(convertBooleans);
	} else if (obj !== null && typeof obj === 'object') {
		return Object.keys(obj).reduce((acc, key) => {
			const value = obj[key];
			if (value === 1) {
				acc[key] = true;
			} else if (value === 0) {
				acc[key] = false;
			} else {
				acc[key] = convertBooleans(value);
			}
			return acc;
		}, {} as any);
	}
	return obj;
}

function cleanResponse<T>(response: T, keepDate: boolean = false): T {
	return convertBooleans(
		omit(response, [
			'collectionId' as keyof T,
			'collectionName' as keyof T,
			'updated' as keyof T,
			keepDate ? ('' as keyof T) : ('created' as keyof T)
		])
	) as T;
}

function expand(item) {
	const newItem = assign(item, { ...item.expand });
	delete newItem.expand;
	return newItem;
}

export { api, authenticate, cleanResponse, expand };
