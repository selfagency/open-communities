/* region imports */
import type { Cookies } from "@sveltejs/kit";

import { error } from "@sveltejs/kit";
import cookie from "cookie";
import PocketBase from "pocketbase";
import { isArray, omit } from "radashi";

import type { TypedPocketBase, UsersRecord } from "$lib/pocketbase.d";

import { dev } from "$app/environment";
import { env } from "$env/dynamic/public";

import { log } from "./logger";
/* endregion imports */

/**
 * Create a fresh PocketBase instance for a single request.
 * Each request gets its own instance to prevent race conditions on
 * `beforeSend` and `authStore` mutations (see P-11 in CODE_REVIEW.md).
 */
export function createApi(): TypedPocketBase {
	const instance = new PocketBase(env.PUBLIC_API_ENDPOINT) as TypedPocketBase;
	instance.autoCancellation(false);
	return instance;
}

// Base singleton — kept for backward-compatible test imports and the authenticate
// helper (test-only). Production code should use createApi() per request.
const api = new PocketBase(env.PUBLIC_API_ENDPOINT) as TypedPocketBase;
api.autoCancellation(false);

async function authenticate(auth: string) {
	try {
		if (auth) api.authStore.loadFromCookie(auth);
		if (api.authStore.isValid) {
			await api.collection("users").authRefresh();
		}
	} catch {
		log.warn("authRefresh failed, clearing auth store");
		api.authStore.clear();
	}

	return api;
}

function cleanResponse<T extends Record<string, unknown>>(
	response: T,
	keepDate: boolean = false,
): T {
	const fields: (keyof T)[] = [
		"collectionId" as keyof T,
		"collectionName" as keyof T,
		"updated" as keyof T,
	];
	if (!keepDate) fields.push("created" as keyof T);
	return convertBooleans(omit(response, fields)) as T;
}

function convertBooleans(obj: unknown): unknown {
	if (isArray(obj)) {
		return obj.map(convertBooleans);
	} else if (obj !== null && typeof obj === "object") {
		const source = obj as Record<string, unknown>;
		return Object.keys(source).reduce<Record<string, unknown>>((acc, key) => {
			const value = source[key];
			if (value === 1) {
				acc[key] = true;
			} else if (value === 0) {
				acc[key] = false;
			} else {
				acc[key] = convertBooleans(value);
			}
			return acc;
		}, {});
	}
	return obj;
}

function expand<T extends Record<string, unknown>>(item: T): Omit<T, "expand"> {
	const { expand: _expand, ...rest } = item;
	return { ...rest, ...(_expand ?? {}) } as Omit<T, "expand">;
}

// Type guard for PocketBase-like errors without depending on the runtime class
// (vitest's pre-bundling doesn't re-export ClientResponseError as a value).
function isPbError(err: unknown): err is { message: string; status: number } {
	return (
		typeof err === "object" &&
		err !== null &&
		"status" in err &&
		"message" in err &&
		typeof (err as Record<string, unknown>).status === "number"
	);
}

function loadUser(
	cookies: Cookies,
): null | (UsersRecord & { email: string; id: string }) {
	const auth = cookies.get("auth");
	if (!auth) return null;
	try {
		const parsed = cookie.parse(auth);
		if (!parsed.pb_auth) return null;
		const decoded = JSON.parse(parsed.pb_auth);
		const model = decoded?.model;
		if (typeof model !== "object" || model === null) return null;
		// Basic shape validation — id and email must be strings
		if (typeof model.id !== "string" || typeof model.email !== "string")
			return null;
		return model as UsersRecord & { email: string; id: string };
	} catch {
		return null;
	}
}

/**
 * Convert an unknown error into a standardized HTTP error and throw it.
 * In production, calls SvelteKit's `error()` which always throws (never returns).
 * In tests (where `error()` is mocked to return), returns the error shape.
 */
function throwAsHttpError(err: unknown): { message: string; status: number } {
	// Re-throw 303 redirects from PB (expected during auth flows)
	if (isPbError(err) && err.status === 303) {
		throw err;
	}

	const status = isPbError(err) && err.status ? err.status : 500;
	const message = isPbError(err)
		? err.message
		: "An unexpected error occurred.";

	// In production, don't leak raw PB error messages to the client
	const clientMessage = dev ? message : "Request failed";

	log.error("load", err);
	return error(status, clientMessage);
}

export {
	api,
	authenticate,
	cleanResponse,
	expand,
	handleError,
	loadUser,
	throwAsHttpError,
};
/** @deprecated Renamed to throwAsHttpError for clarity. */
const handleError = throwAsHttpError;
