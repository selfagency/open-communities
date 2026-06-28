import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';
import type { TypedPocketBase } from '$lib/pocketbase.d';

const api = new PocketBase(env.PUBLIC_API_ENDPOINT) as TypedPocketBase;
api.autoCancellation(false);

export { api };
