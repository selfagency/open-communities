import { error, fail } from '@sveltejs/kit';
import { withRetry } from '$lib/server/api';
import { log } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ locals, url }) => {
  const client = locals.api;
  const search = url.searchParams.get('q') ?? '';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  // Build filter — search across key and all locale values
  let filter = '';
  if (search) {
    filter = client.filter('key ~ {:search} || value ~ {:search}', { search });
  }

  // Fetch matching records
  const records = await client
    .collection('translations')
    .getFullList({
      filter: filter || undefined,
      sort: 'key,locale',
      requestKey: `admin-translations-${page}`
    })
    .catch(() => []);

  // Collect distinct locales from data
  const localeSet = new Set<string>();
  for (const r of records as unknown as Record<string, unknown>[]) {
    localeSet.add(r.locale as string);
  }
  const locales = [...localeSet].sort((a, b) => a.localeCompare(b));

  // Group by key
  const keyMap: Record<string, Array<{ locale: string; value: string; id: string }>> = {};
  for (const r of records as unknown as Record<string, unknown>[]) {
    const key = r.key as string;
    if (!Object.hasOwn(keyMap, key)) {
      keyMap[key] = [];
    }
    keyMap[key].push({
      id: r.id as string,
      locale: r.locale as string,
      value: (r.value as string) ?? ''
    });
  }

  // Sort keys alphabetically
  const sortedKeys = Object.keys(keyMap).sort((a, b) => a.localeCompare(b));
  const total = sortedKeys.length;
  const totalPages = Math.ceil(total / PER_PAGE);
  const offset = (page - 1) * PER_PAGE;
  const pageKeys = sortedKeys.slice(offset, offset + PER_PAGE);

  const translations = pageKeys.map((key) => ({ key, entries: keyMap[key] }));

  return {
    translations,
    locales,
    pagination: { page, totalPages, total, search, perPage: PER_PAGE }
  };
};

export const actions = {
  save: async ({ locals, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }
    const form = await request.formData();
    const key = form.get('key') as string;
    const entriesJson = form.get('entries') as string;

    if (!(key && entriesJson)) {
      return fail(400, { error: 'Key and entries are required' });
    }

    let entries: Array<{ locale: string; value: string; id?: string }>;
    try {
      entries = JSON.parse(entriesJson);
    } catch {
      return fail(400, { error: 'Invalid entries JSON' });
    }

    // Parallel save with rollback on partial failure
    const results = await Promise.allSettled(
      entries.map((entry) =>
        entry.id
          ? withRetry(() => client.collection('translations').update(entry.id, { value: entry.value }))
          : withRetry(() => client.collection('translations').create({ key, locale: entry.locale, value: entry.value }))
      )
    );

    const created: string[] = [];
    let updated = 0;
    const errors: number[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && !entries[i].id) {
        created.push(r.value.id);
      } else if (r.status === 'fulfilled' && entries[i].id) {
        updated++;
      } else {
        errors.push(i);
      }
    });

    // Roll back creates if any entry failed
    if (errors.length > 0 && created.length > 0) {
      await Promise.allSettled(created.map((id) => withRetry(() => client.collection('translations').delete(id))));
      return fail(500, { error: 'Save failed — rolled back', created: created.length, updated, errors: errors.length });
    }

    return { success: true, created: created.length, updated, errors: errors.length };
  },

  delete: async ({ locals, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }
    const form = await request.formData();
    const key = form.get('key') as string;

    if (!key) {
      return fail(400, { error: 'Key is required' });
    }

    const records = await client
      .collection('translations')
      .getFullList({ filter: client.filter('key = {:key}', { key }), requestKey: `del-${key}` })
      .catch(() => []);

    let deleted = 0;
    for (const r of records as unknown as Record<string, unknown>[]) {
      try {
        await withRetry(() => client.collection('translations').delete(r.id as string));
        deleted++;
      } catch {
        /* skip */
      }
    }

    return { success: true, deleted };
  },

  add: async ({ locals, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }
    const form = await request.formData();
    const key = form.get('key') as string;
    const value = form.get('value') as string;

    if (!key) {
      return fail(400, { error: 'Key is required' });
    }

    try {
      await withRetry(() => client.collection('translations').create({ key, locale: 'en', value: value || '' }));
      return { success: true, key };
    } catch (err: unknown) {
      log.error('Failed to create translation key', err);
      return fail(400, { error: 'Failed to create key' });
    }
  },

  redeploy: async ({ locals }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }
    const coolifyUrl = process.env.COOLIFY_URL;
    const coolifyToken = process.env.COOLIFY_TOKEN;
    const coolifyAppUuid = process.env.COOLIFY_APP_UUID;

    if (!(coolifyUrl && coolifyToken && coolifyAppUuid)) {
      return fail(500, { error: 'Coolify is not configured' });
    }

    try {
      const baseUrl = coolifyUrl.endsWith('/') ? coolifyUrl.slice(0, -1) : coolifyUrl;
      const url = `${baseUrl}/api/v1/deploy?uuid=${coolifyAppUuid}&force=true`;
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${coolifyToken}` }
      });

      if (!res.ok) {
        log.error('Coolify redeploy failed', { status: res.status });
        return fail(502, { error: 'Rebuild failed' });
      }

      const data = await res.json();
      const deploymentUuid = data?.deployments?.[0]?.deployment_uuid;

      if (!deploymentUuid) {
        return fail(502, { error: 'Rebuild failed: no deployment UUID returned' });
      }

      return { deploymentUuid };
    } catch (err: unknown) {
      log.error('Coolify redeploy error', err);
      return fail(502, { error: 'Rebuild failed' });
    }
  },

  status: async ({ locals, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }
    const form = await request.formData();
    const deploymentUuid = form.get('uuid') as string;

    if (!deploymentUuid) {
      return fail(400, { error: 'Missing deployment UUID' });
    }

    const coolifyUrl = process.env.COOLIFY_URL;
    const coolifyToken = process.env.COOLIFY_TOKEN;

    if (!(coolifyUrl && coolifyToken)) {
      return fail(500, { error: 'Coolify is not configured' });
    }

    try {
      const baseUrl = coolifyUrl.endsWith('/') ? coolifyUrl.slice(0, -1) : coolifyUrl;
      const url = `${baseUrl}/api/v1/deployments/${deploymentUuid}`;
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${coolifyToken}` }
      });

      if (!res.ok) {
        log.error('Coolify status check failed', { status: res.status });
        return fail(502, { error: 'Status check failed' });
      }

      const data = await res.json();
      return { status: data.status as string };
    } catch (err: unknown) {
      log.error('Coolify status check error', err);
      return fail(502, { error: 'Status check failed' });
    }
  }
} satisfies Actions;
