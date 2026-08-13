import { env } from '$env/dynamic/private';
import { processTranslationResults, translateLocale } from '$lib/server/translate';

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

export function getLibreTranslateConfig() {
  const ltUrl = env.LT_API_URL;
  const ltKey = env.LT_API_KEY;
  if (!ltUrl) {
    return { apiUrl: '', error: 'LT_API_URL missing', ltKey: '' } as const;
  }
  const apiUrl = ltUrl.endsWith('/') ? ltUrl.slice(0, -1) : ltUrl;
  return { apiUrl, error: null, ltKey } as const;
}

export function validateTranslateInput(text: string, localesStr: string): string[] | null {
  if (!(text && localesStr)) {
    return null;
  }
  const locales = parseLocales(localesStr);
  if (locales === null || locales.length === 0) {
    return null;
  }
  return locales;
}

export async function doTranslations(text: string, locales: string[], apiUrl: string, ltKey: string | undefined) {
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
    // biome-ignore lint/performance/noAwaitInLoops: polling loop must be sequential — each iteration waits for the previous
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/runs?branch=main&event=workflow_dispatch&per_page=1`,
      { headers: { accept: 'application/vnd.github.v3+json', authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      const data = (await res.json()) as { workflow_runs: Array<{ id: number }> };
      // biome-ignore lint/suspicious/noUnnecessaryConditions: workflow_runs may be absent in the API response
      const latest = data.workflow_runs?.[0];
      if (latest && latest.id > prevRunId) {
        return latest.id;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

export async function triggerDeploy(ghToken: string, owner: string, repo: string) {
  const prevRunsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/runs?branch=main&event=workflow_dispatch&per_page=1`,
    { headers: { accept: 'application/vnd.github.v3+json', authorization: `Bearer ${ghToken}` } }
  );

  const prevRunId = prevRunsRes.ok
    ? // biome-ignore lint/suspicious/noUnnecessaryConditions: workflow_runs may be absent in the API response
      (((await prevRunsRes.json()) as { workflow_runs: Array<{ id: number }> }).workflow_runs?.[0]?.id ?? 0)
    : 0;

  const dispatchRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`,
    {
      body: JSON.stringify({ ref: 'main' }),
      headers: { accept: 'application/vnd.github.v3+json', authorization: `Bearer ${ghToken}` },
      method: 'POST'
    }
  );

  if (!dispatchRes.ok) {
    throw new Error(`Dispatch failed: ${dispatchRes.status}`);
  }

  const runId = await pollNewRunId(owner, repo, ghToken, prevRunId, 10_000);
  if (!runId) {
    return { message: 'Deploy triggered, but could not determine run ID', triggered: true };
  }

  return { deploymentUuid: String(runId) };
}

export function getAdminClient(locals: App.Locals) {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) {
    // keep parity with route behavior which throws a HttpError from svelte-kit
    // the route will map this to error(401) for HTTP responses
    throw new Error('Unauthorized');
  }
  return client;
}
