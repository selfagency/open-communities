import { error, fail } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { env } from '$env/dynamic/private';
import { withRetry } from '$lib/server/api';
import { log } from '$lib/server/logger';
import { rateLimitByUser } from '$lib/server/rate-limit';
import { processTranslationResults, translateLocale } from '$lib/server/translate';
import type { Actions, PageServerLoad } from './$types';

const PER_PAGE = 20;

const entriesSchema = z.array(
  z.object({
    id: z.string().optional(),
    locale: z.string(),
    value: z.string()
  })
);

export const load: PageServerLoad = async ({ locals, url }) => {
  // Require admin client so the admin translations page always sees all locale records
  const client = getAdminClient(locals);
  const search = url.searchParams.get('q') ?? '';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  // Build filter — search across key and all locale values
  let filter = '';
  if (search) {
    filter = client.filter('key ~ {:search} || value ~ {:search}', { search });
  }

  // Fetch matching records (no requestKey — auto-cancellation conflicts with
  // getFullList's pagination and would cancel its own page requests)
  const records = await client
    .collection('translations')
    .getFullList({
      filter: filter || undefined,
      sort: 'key,locale'
    })
    .catch(() => []);

  log.info('admin translations load', { recordsCount: records.length });

  // Collect distinct locales from data
  const localeSet = new Set<string>();
  for (const r of records) {
    localeSet.add(r.locale as string);
  }
  const locales = [...localeSet].sort((a, b) => a.localeCompare(b));

  // Group by key
  const keyMap: Record<string, Array<{ locale: string; value: string; id: string }>> = {};
  for (const r of records) {
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
    // expose recordsCount for runtime debugging (number of PB records returned)
    recordsCount: records.length,
    pagination: { page, totalPages, total, search, perPage: PER_PAGE }
  };
};

function getAdminClient(locals: App.Locals) {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }
  return client;
}

// Parse locales from JSON string safely
// Parse locales from JSON string safely.
// Returns:
// - string[] when a valid array of locales was provided
// - null when the JSON was syntactically invalid
// - [] when JSON parsed successfully but is not an array (treated as empty)
function parseLocales(localesStr: string): string[] | null {
  try {
    const parsed = JSON.parse(localesStr);
    if (Array.isArray(parsed)) {
      return parsed as string[];
    }
    return [];
  } catch {
    return null;
  }
}

// Build LibreTranslate config (api URL + key) with sanity checks
function getLibreTranslateConfig() {
  const ltUrl = env.LT_API_URL;
  const ltKey = env.LT_API_KEY;
  if (!ltUrl) {
    return { apiUrl: '', ltKey: '', error: 'LT_API_URL missing' } as const;
  }
  const apiUrl = ltUrl.endsWith('/') ? ltUrl.slice(0, -1) : ltUrl;
  return { apiUrl, ltKey, error: null } as const;
}

// Validate translate action input. Returns parsed locales on success, or null on any validation failure.
function validateTranslateInput(text: string, localesStr: string): string[] | null {
  if (!(text && localesStr)) {
    return null;
  }
  const locales = parseLocales(localesStr);
  if (locales === null || locales.length === 0) {
    return null;
  }
  return locales;
}

async function doTranslations(text: string, locales: string[], apiUrl: string, ltKey: string | undefined) {
  const rawResults = await Promise.allSettled(locales.map((locale) => translateLocale(text, locale, apiUrl, ltKey)));
  return processTranslationResults(rawResults);
}

async function pollNewRunId(
  owner: string,
  repo: string,
  token: string,
  prevRunId: number,
  timeoutMs: number
): Promise<number | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/runs?branch=main&event=workflow_dispatch&per_page=1`,
      { headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github.v3+json' } }
    );
    if (res.ok) {
      const data = (await res.json()) as { workflow_runs: Array<{ id: number }> };
      const latest = data.workflow_runs?.[0];
      if (latest && latest.id > prevRunId) {
        return latest.id;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

async function triggerDeploy(
  ghToken: string,
  owner: string,
  repo: string
): Promise<{ deploymentUuid: string } | { triggered: true; message: string }> {
  // Get the latest run before triggering
  const prevRunsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/runs?branch=main&event=workflow_dispatch&per_page=1`,
    { headers: { authorization: `Bearer ${ghToken}`, accept: 'application/vnd.github.v3+json' } }
  );

  const prevRunId = prevRunsRes.ok
    ? (((await prevRunsRes.json()) as { workflow_runs: Array<{ id: number }> }).workflow_runs?.[0]?.id ?? 0)
    : 0;

  const dispatchRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${ghToken}`, accept: 'application/vnd.github.v3+json' },
      body: JSON.stringify({ ref: 'main' })
    }
  );

  if (!dispatchRes.ok) {
    throw new Error(`Dispatch failed: ${dispatchRes.status}`);
  }

  const runId = await pollNewRunId(owner, repo, ghToken, prevRunId, 10_000);
  if (!runId) {
    return { triggered: true, message: 'Deploy triggered, but could not determine run ID' };
  }

  return { deploymentUuid: String(runId) };
}

export const actions = {
  save: async ({ locals, request }) => {
    const client = getAdminClient(locals);
    const form = await request.formData();
    const key = form.get('key') as string;
    const entriesJson = form.get('entries') as string;

    if (!(key && entriesJson)) {
      return fail(400, { error: 'Key and entries are required' });
    }

    let entries: Array<{ locale: string; value: string; id?: string }>;
    try {
      const raw = JSON.parse(entriesJson);
      const parsed = entriesSchema.safeParse(raw);
      if (!parsed.success) {
        return fail(400, { error: 'Invalid entries format' });
      }
      entries = parsed.data;
    } catch {
      return fail(400, { error: 'Invalid entries JSON' });
    }

    // Upsert: find existing record by (key, locale), update if found, create if not.
    // Uses a single getFullList for all locales to minimize API calls, then batch
    // executes the updates/creates via Promise.allSettled.
    const existingRecords = await client
      .collection('translations')
      .getFullList({
        filter: client.filter('key = {:key}', { key }),
        requestKey: `upsert-lookup-${key}`
      })
      .catch(() => []);
    const existingByLocale = new Map(existingRecords.map((r: Record<string, unknown>) => [r.locale, r]));

    const results = await Promise.allSettled(
      entries.map(async (entry) => {
        const existing = existingByLocale.get(entry.locale);
        if (existing) {
          return withRetry(() =>
            client.collection('translations').update(existing.id as string, { value: entry.value })
          );
        }
        return withRetry(() =>
          client.collection('translations').create({ key, locale: entry.locale, value: entry.value })
        );
      })
    );

    const created: string[] = [];
    let updated = 0;
    const errors: number[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        if (existingByLocale.has(entries[i].locale)) {
          updated++;
        } else {
          created.push(r.value.id);
        }
      } else {
        errors.push(i);
      }
    });

    // Roll back creates if any entry failed
    if (errors.length > 0 && created.length > 0) {
      await Promise.allSettled(created.map((id) => withRetry(() => client.collection('translations').delete(id))));
      return fail(500, { error: 'Save failed — rolled back', created: created.length, updated, errors: errors.length });
    }

    // Return failure when existing entries fail to save (no creates to roll back)
    if (errors.length > 0) {
      return fail(500, {
        error: `${errors.length} entr${errors.length === 1 ? 'y' : 'ies'} failed to save`,
        created: created.length,
        updated,
        errors: errors.length
      });
    }

    return { success: true, created: created.length, updated, errors: errors.length };
  },

  delete: async ({ locals, request }) => {
    const client = getAdminClient(locals);
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
    for (const r of records) {
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
    const client = getAdminClient(locals);
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
    const client = getAdminClient(locals);
    rateLimitByUser(client.authStore.record?.id ?? 'unknown', 3, 60_000);
    const ghToken = env.GH_DEPLOY_TOKEN;
    if (!ghToken) {
      return fail(500, { error: 'Deploy is not configured' });
    }

    try {
      const result = await triggerDeploy(ghToken, 'selfagency', 'open-communities');
      if ('triggered' in result) {
        return result;
      }
      return { deploymentUuid: result.deploymentUuid };
    } catch (err: unknown) {
      log.error('GitHub Actions deploy error', err);
      return fail(502, { error: 'Rebuild failed' });
    }
  },

  translate: async ({ locals, request }) => {
    getAdminClient(locals);
    const form = await request.formData();
    const text = form.get('text') as string;
    const localesStr = form.get('locales') as string;

    const locales = validateTranslateInput(text, localesStr);
    if (locales === null) {
      return fail(400, { error: 'Missing text or locales' });
    }
    const { apiUrl, ltKey, error: cfgErr } = getLibreTranslateConfig();
    if (cfgErr) {
      log.error('LibreTranslate not configured', { err: cfgErr });
      return fail(500, { error: 'LibreTranslate is not configured' });
    }

    log.info('Translating', { textLength: text.length, locales, apiUrl, hasKey: !!ltKey });

    const { translations, errors } = await doTranslations(text, locales, apiUrl, ltKey);

    if (translations.length === 0) {
      log.error('All translations failed', { errors });
      return fail(502, { error: errors[0] ?? 'All translations failed' });
    }

    if (errors.length > 0) {
      log.warn('Partial translation failures', { errors });
    }

    return { success: true, translations, ...(errors.length > 0 ? { errors } : {}) };
  },

  status: async ({ locals, request }) => {
    getAdminClient(locals);
    const form = await request.formData();
    const runId = form.get('uuid') as string;

    if (!runId) {
      return fail(400, { error: 'Missing run ID' });
    }

    const ghToken = env.GH_DEPLOY_TOKEN;
    if (!ghToken) {
      return fail(500, { error: 'Deploy is not configured' });
    }

    const owner = 'selfagency';
    const repo = 'open-communities';

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`, {
        headers: { authorization: `Bearer ${ghToken}`, accept: 'application/vnd.github.v3+json' }
      });

      if (!res.ok) {
        log.error('GitHub run status check failed', { status: res.status });
        return fail(502, { error: 'Status check failed' });
      }

      const data = (await res.json()) as { status: string; conclusion: string | null };

      // Map GitHub Actions statuses to frontend-expected values
      if (data.status === 'completed') {
        if (data.conclusion === 'success') {
          return { status: 'success' };
        }
        if (data.conclusion === 'cancelled') {
          return { status: 'cancelled' };
        }
        return { status: 'failed' };
      }

      return { status: data.status === 'in_progress' ? 'in_progress' : 'queued' };
    } catch (err: unknown) {
      log.error('GitHub run status check error', err);
      return fail(502, { error: 'Status check failed' });
    }
  }
} satisfies Actions;
