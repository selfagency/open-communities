import { env } from '$env/dynamic/private';
import { log } from '$lib/server/logger';

const PH_API_KEY = env.POSTHOG_CLI_API_KEY;
const PH_PROJECT_ID = env.POSTHOG_CLI_PROJECT_ID;
const PH_HOST = env.POSTHOG_CLI_HOST || 'https://us.i.posthog.com';

interface PhChange {
  percent: number;
  direction: 'Up' | 'Down';
  color: string;
  text: string;
  long_text: string;
}

interface PhMetric {
  current: number;
  previous: number;
  change: PhChange;
}

export interface WeeklyDigest {
  visitors: PhMetric;
  pageviews: PhMetric;
  sessions: PhMetric;
  bounce_rate: PhMetric & { current: number; previous: number };
  avg_session_duration: PhMetric & { current: string; previous: string };
  top_pages: Array<{ host: string; path: string; visitors: number; change: PhChange | null }>;
  top_sources: Array<{ name: string; visitors: number; change: PhChange | null }>;
  goals: Array<{ name: string; conversions: number; change: PhChange }>;
  dashboard_url: string;
}

interface HogQLResult {
  results: Array<Array<unknown>>;
  columns: string[];
  types: string[];
}

interface PostHogInsight {
  id: number;
  short_id: string;
  name: string;
  derived_name: string;
  query: Record<string, unknown> | null;
  result: unknown | null;
  last_refresh: string | null;
}

export interface InsightResult {
  id: number;
  short_id: string;
  name: string;
  result: unknown | null;
}

/** Check if PostHog credentials are configured. */
export function isConfigured(): boolean {
  return !!PH_API_KEY && !!PH_PROJECT_ID;
}

/** Fetch the web analytics weekly digest from PostHog. */
export async function getWeeklyDigest(days = 7): Promise<WeeklyDigest | null> {
  if (!isConfigured()) return null;

  try {
    const url = `${PH_HOST}/api/projects/${PH_PROJECT_ID}/web_analytics/weekly_digest/?days=${days}&compare=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${PH_API_KEY}` }
    });

    if (!res.ok) {
      log.error('PostHog weekly digest fetch failed', { status: res.status });
      return null;
    }

    return res.json() as Promise<WeeklyDigest>;
  } catch (error) {
    log.error('PostHog weekly digest error', error);
    return null;
  }
}

/** Execute a HogQL query against PostHog. */
export async function queryHogQL(sql: string): Promise<HogQLResult | null> {
  if (!isConfigured()) return null;

  try {
    const url = `${PH_HOST}/api/projects/${PH_PROJECT_ID}/query/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PH_API_KEY}`
      },
      body: JSON.stringify({
        query: { kind: 'HogQLQuery', query: sql }
      })
    });

    if (!res.ok) {
      log.error('PostHog HogQL query failed', { status: res.status });
      return null;
    }

    return res.json() as Promise<HogQLResult>;
  } catch (error) {
    log.error('PostHog HogQL query error', error);
    return null;
  }
}

/** Fetch a saved PostHog insight by its numeric ID or short_id. */
export async function getInsight(id: number | string): Promise<InsightResult | null> {
  if (!isConfigured()) return null;
  try {
    const url = `${PH_HOST}/api/projects/${PH_PROJECT_ID}/insights/${id}/`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${PH_API_KEY}` }
    });
    if (!res.ok) {
      log.error('PostHog insight fetch failed', { status: res.status, id });
      return null;
    }
    const data = (await res.json()) as PostHogInsight;
    return {
      id: data.id,
      short_id: data.short_id,
      name: data.name || data.derived_name || '',
      result: data.result
    };
  } catch (error) {
    log.error('PostHog insight fetch error', error);
    return null;
  }
}

/** List saved insights, optionally filtered by search. */
export async function listInsights(search?: string): Promise<InsightResult[]> {
  if (!isConfigured()) return [];
  try {
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.set('search', search);
    const url = `${PH_HOST}/api/projects/${PH_PROJECT_ID}/insights/?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${PH_API_KEY}` }
    });
    if (!res.ok) {
      log.error('PostHog insight list failed', { status: res.status });
      return [];
    }
    const data = (await res.json()) as { results: PostHogInsight[] };
    return (data.results || []).map((i) => ({
      id: i.id,
      short_id: i.short_id,
      name: i.name || i.derived_name || '',
      result: i.result
    }));
  } catch (error) {
    log.error('PostHog insight list error', error);
    return [];
  }
}
