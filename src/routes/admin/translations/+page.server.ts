import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { getAdminClient } from '$lib/server/admin-translations';
import { log } from '$lib/server/logger';
import { addSchema, deleteSchema } from './_shared';
import type { PageServerLoad } from './$types';

const PER_PAGE = 20;

function extractLocales(records: Record<string, unknown>[]): string[] {
  const localeSet = new Set<string>();
  for (const r of records) {
    localeSet.add(r.locale as string);
  }
  return [...localeSet].sort((a, b) => a.localeCompare(b));
}

function groupRecordsByKey(
  records: Record<string, unknown>[]
): Record<string, Array<{ locale: string; value: string; id: string }>> {
  const keyMap: Record<string, Array<{ locale: string; value: string; id: string }>> = {};
  for (const r of records) {
    const key = r.key as string;
    if (!Object.hasOwn(keyMap, key)) {
      keyMap[key] = [];
    }
    keyMap[key].push({
      id: r.id as string,
      locale: r.locale as string,
      value: (r.value as string) || ''
    });
  }
  return keyMap;
}

function paginateKeys(
  keyMap: Record<string, unknown>,
  page: number
): { pageKeys: string[]; total: number; totalPages: number } {
  const sortedKeys = Object.keys(keyMap).sort((a, b) => a.localeCompare(b));
  const total = sortedKeys.length;
  const totalPages = Math.ceil(total / PER_PAGE);
  const offset = (page - 1) * PER_PAGE;
  const pageKeys = sortedKeys.slice(offset, offset + PER_PAGE);
  return { pageKeys, total, totalPages };
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const client = getAdminClient(locals);
  const search = url.searchParams.get('q') ?? '';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  let filter = '';
  if (search) {
    filter = client.filter('key ~ {:search} || value ~ {:search}', { search });
  }

  let records: Record<string, unknown>[] = [];
  try {
    records = await client.collection('translations').getFullList({
      filter: filter || undefined,
      sort: 'key,locale'
    });
    log.info('admin translations load', { recordsCount: records.length });
  } catch (err: unknown) {
    log.error('admin translations load failed', err);
    throw error(502, 'Failed to load translations — check PocketBase auth and collection rules');
  }

  const locales = extractLocales(records);
  const keyMap = groupRecordsByKey(records);
  const { pageKeys, total, totalPages } = paginateKeys(keyMap, page);

  const translations = pageKeys.map((key) => ({ entries: keyMap[key], key }));

  return {
    addForm: await superValidate(zod4(addSchema)),
    deleteForm: await superValidate(zod4(deleteSchema)),
    locales,
    pagination: { page, perPage: PER_PAGE, search, total, totalPages },
    recordsCount: records.length,
    translations
  };
};

// actions moved into a separate module to reduce file complexity
export { actions } from './actions';
