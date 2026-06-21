/* region imports */
import PocketBase from 'pocketbase';
import { isArray, omit } from 'radashi';
import { env } from '$env/dynamic/public';
import type { TypedPocketBase } from '$lib/pocketbase.d';

/* endregion imports */

// instantiate pocketbase api service

const api = new PocketBase(env.PUBLIC_API_ENDPOINT) as TypedPocketBase;
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

function cleanResponse<T extends Record<string, unknown>>(response: T, keepDate: boolean = false): T {
  const fields: (keyof T)[] = ['collectionId' as keyof T, 'collectionName' as keyof T, 'updated' as keyof T];
  if (!keepDate) fields.push('created' as keyof T);
  return convertBooleans(omit(response, fields)) as T;
}

function convertBooleans(obj: unknown): unknown {
  if (isArray(obj)) {
    return obj.map(convertBooleans);
  } else if (obj !== null && typeof obj === 'object') {
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

function expand<T extends Record<string, unknown>>(item: T): Omit<T, 'expand'> {
  const { expand: _expand, ...rest } = item;
  return { ...rest, ...(_expand ?? {}) } as Omit<T, 'expand'>;
}

export { api, authenticate, cleanResponse, expand };
