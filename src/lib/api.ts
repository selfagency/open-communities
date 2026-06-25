/* region imports */
import PocketBase from 'pocketbase';
import { omit } from 'radashi';
import { env } from '$env/dynamic/public';
import type { TypedPocketBase } from '$lib/pocketbase.d';

/* endregion imports */

// instantiate pocketbase api service

const api = new PocketBase(env.PUBLIC_API_ENDPOINT) as TypedPocketBase;
api.autoCancellation(false);

function cleanResponse<T extends Record<string, unknown>>(response: T, keepDate = false): Partial<T> {
  const fields: (keyof T)[] = ['collectionId' as keyof T, 'collectionName' as keyof T, 'updated' as keyof T];
  if (!keepDate) {
    fields.push('created' as keyof T);
  }
  return omit(response, fields);
}

function expand<T extends Record<string, unknown>>(item: T): Omit<T, 'expand'> {
  const { expand: _expand, ...rest } = item;
  return { ...rest, ...(_expand ?? {}) } as Omit<T, 'expand'>; // NOSONAR — TypeScript requires fallback for spread
}

export { api, cleanResponse, expand };
