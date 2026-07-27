import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import {
  doTranslations,
  getAdminClient,
  getLibreTranslateConfig,
  triggerDeploy,
  validateTranslateInput
} from '$lib/server/admin-translations';
import { withRetry } from '$lib/server/api';
import { log } from '$lib/server/logger';
import { rateLimitByUser } from '$lib/server/rate-limit';
import { addSchema, deleteSchema, saveSchema } from './_shared';
import type { Actions } from './$types';

const entriesSchema = z.array(
  z.object({
    id: z.string().optional(),
    locale: z.string(),
    value: z.string()
  })
);

function countUpsertResults(
  results: PromiseSettledResult<unknown>[],
  entries: Array<{ locale: string; value: string; id?: string }>,
  existingByLocale: Map<string, unknown>
) {
  const created: string[] = [];
  let updated = 0;
  const errors: number[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      if (existingByLocale.has(entries[i].locale)) {
        updated++;
      } else {
        const v = r as PromiseFulfilledResult<Record<string, unknown>>;
        const id = v.value?.id as string | undefined;
        if (id) {
          created.push(id);
        }
      }
    } else {
      errors.push(i);
    }
  });
  return { created, updated, errors };
}

function handleSaveErrors(
  client: ReturnType<typeof getAdminClient>,
  errors: number[],
  created: string[],
  updated: number
) {
  if (errors.length > 0 && created.length > 0) {
    Promise.allSettled(created.map((id) => withRetry(() => client.collection('translations').delete(id))));
    return fail(500, { error: 'Save failed — rolled back', created: created.length, updated, errors: errors.length });
  }

  if (errors.length > 0) {
    return fail(500, {
      error: `${errors.length} entr${errors.length === 1 ? 'y' : 'ies'} failed to save`,
      created: created.length,
      updated,
      errors: errors.length
    });
  }

  return { success: true, created: created.length, updated, errors: errors.length };
}

function mapRunConclusion(data: { status: string; conclusion: string | null }): string {
  if (data.status !== 'completed') {
    return data.status === 'in_progress' ? 'in_progress' : 'queued';
  }
  if (data.conclusion === 'success') {
    return 'success';
  }
  if (data.conclusion === 'cancelled') {
    return 'cancelled';
  }
  return 'failed';
}

export const actions: Actions = {
  save: async ({ locals, request }) => {
    const client = getAdminClient(locals);

    const form = await superValidate(request, zod4(saveSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const key = form.data.key;
    const entriesJson = form.data.entries;

    function parseEntries(jsonStr: string) {
      const raw = JSON.parse(jsonStr);
      const parsed = entriesSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error('Invalid entries format');
      }
      return parsed.data as Array<{ locale: string; value: string; id?: string }>;
    }

    async function loadExisting(keyVal: string) {
      return await client.collection('translations').getFullList({
        filter: client.filter('key = {:key}', { key: keyVal })
      });
    }

    async function upsertEntries(
      keyVal: string,
      entries: Array<{ locale: string; value: string; id?: string }>,
      existingRecords: Record<string, unknown>[]
    ) {
      const existingByLocale = new Map(existingRecords.map((r: Record<string, unknown>) => [r.locale as string, r]));

      const results = await Promise.allSettled(
        entries.map((entry) => {
          const existing = existingByLocale.get(entry.locale);
          if (existing) {
            return withRetry(() =>
              client.collection('translations').update(existing.id as string, { value: entry.value })
            );
          }
          return withRetry(() =>
            client.collection('translations').create({ key: keyVal, locale: entry.locale, value: entry.value })
          );
        })
      );

      const { created, updated, errors } = countUpsertResults(results, entries, existingByLocale);
      return { created, updated, errors, results } as const;
    }

    let entries: Array<{ locale: string; value: string; id?: string }>;
    try {
      entries = parseEntries(entriesJson);
    } catch {
      return fail(400, { form, error: 'Invalid entries JSON' });
    }

    let existingRecords: Record<string, unknown>[] = [];

    if (entries.every((e) => typeof e.id === 'string' && e.id)) {
      existingRecords = entries.map((e) => ({ id: e.id, locale: e.locale }));
    } else {
      try {
        existingRecords = await loadExisting(key);
      } catch (err: unknown) {
        log.error('translations save: getFullList failed', err);
        if (entries.some((e) => typeof e.id === 'string' && e.id)) {
          log.warn('translations save: getFullList failed — using provided ids as existing records', {
            key,
            provided: entries.filter((e) => e.id).map((e) => e.id)
          });
          existingRecords = entries
            .filter((e) => typeof e.id === 'string' && e.id)
            .map((e) => ({ id: e.id as string, locale: e.locale }));
        } else {
          return fail(502, { form, error: 'Could not load existing translations — check PB auth/rules' });
        }
      }
    }

    const { created, updated, errors } = await upsertEntries(key, entries, existingRecords);
    return { form, ...handleSaveErrors(client, errors, created, updated) };
  },

  delete: async ({ locals, request }) => {
    const client = getAdminClient(locals);

    const form = await superValidate(request, zod4(deleteSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const key = form.data.key;

    const records = await client
      .collection('translations')
      .getFullList({ filter: client.filter('key = {:key}', { key }) })
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

    return { form, success: true, deleted };
  },

  add: async ({ locals, request }) => {
    const client = getAdminClient(locals);

    const form = await superValidate(request, zod4(addSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { key, value } = form.data;

    try {
      await withRetry(() => client.collection('translations').create({ key, locale: 'en', value: value || '' }));
      return { form, success: true, key };
    } catch (err: unknown) {
      log.error('Failed to create translation key', err);
      return fail(400, { form, error: 'Failed to create key' });
    }
  },

  redeploy: async ({ locals }) => {
    const client = getAdminClient(locals);
    rateLimitByUser(client.authStore.record?.id ?? 'unknown', 3, 60_000);
    const ghToken = (process.env.GH_DEPLOY_TOKEN as string) || '';
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
    if (!locales) {
      return fail(400, { error: 'Missing text or locales' });
    }

    const { apiUrl, ltKey, error: cfgError } = getLibreTranslateConfig();
    if (cfgError) {
      return fail(500, { error: 'LibreTranslate is not configured' });
    }

    try {
      const { translations, errors } = await doTranslations(text, locales, apiUrl, ltKey);
      if (translations.length === 0 && errors.length > 0) {
        return fail(502, { error: 'Translation API error' });
      }
      return { success: true, translations, errors } as const;
    } catch (err: unknown) {
      log.error('translate action failed', err);
      return fail(502, { error: 'Translation API error' });
    }
  },

  status: async ({ locals, request }) => {
    getAdminClient(locals);
    const form = await request.formData();
    const runId = form.get('uuid') as string;

    if (!runId) {
      return fail(400, { error: 'Missing run ID' });
    }

    const ghToken = (process.env.GH_DEPLOY_TOKEN as string) || '';
    if (!ghToken) {
      return fail(500, { error: 'Deploy is not configured' });
    }

    try {
      const res = await fetch(`https://api.github.com/repos/selfagency/open-communities/actions/runs/${runId}`, {
        headers: { authorization: `Bearer ${ghToken}`, accept: 'application/vnd.github.v3+json' }
      });

      if (!res.ok) {
        log.error('GitHub run status check failed', { status: res.status });
        return fail(502, { error: 'Status check failed' });
      }

      const data = (await res.json()) as { status: string; conclusion: string | null };
      return { status: mapRunConclusion(data) };
    } catch (err: unknown) {
      log.error('GitHub run status check error', err);
      return fail(502, { error: 'Status check failed' });
    }
  }
};
