import { env } from '$env/dynamic/private';
import { log } from '$lib/server/logger';

const PH_API_KEY = env.POSTHOG_CLI_API_KEY;
const PH_PROJECT_ID = env.POSTHOG_CLI_PROJECT_ID;
const PH_HOST = env.POSTHOG_CLI_HOST || 'https://us.i.posthog.com';

interface PhChange {
  color: string;
  direction: 'Up' | 'Down';
  long_text: string;
  percent: number;
  text: string;
}

interface PhMetric {
  change: PhChange;
  current: number;
  previous: number;
}

export interface WeeklyDigest {
  avg_session_duration: PhMetric & { current: string; previous: string };
  bounce_rate: PhMetric & { current: number; previous: number };
  dashboard_url: string;
  goals: Array<{ name: string; conversions: number; change: PhChange }>;
  pageviews: PhMetric;
  sessions: PhMetric;
  top_pages: Array<{ host: string; path: string; visitors: number; change: PhChange | null }>;
  top_sources: Array<{ name: string; visitors: number; change: PhChange | null }>;
  visitors: PhMetric;
}

interface HogQLResult {
  columns: string[];
  results: unknown[][];
  types: string[];
}

interface PostHogInsight {
  derived_name: string;
  id: number;
  last_refresh: string | null;
  name: string;
  query: Record<string, unknown> | null;
  result: unknown;
  short_id: string;
}

interface InsightResult {
  id: number;
  name: string;
  result: unknown;
  short_id: string;
}

/** Check if PostHog credentials are configured. */
function isConfigured(): boolean {
  return !!PH_API_KEY && !!PH_PROJECT_ID;
}

/** Fetch the web analytics weekly digest from PostHog. */
export async function getWeeklyDigest(days = 7): Promise<WeeklyDigest | null> {
  if (!isConfigured()) {
    return null;
  }

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
async function queryHogQL(sql: string): Promise<HogQLResult | null> {
  if (!isConfigured()) {
    return null;
  }

  try {
    const url = `${PH_HOST}/api/projects/${PH_PROJECT_ID}/query/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PH_API_KEY}`
      },
      body: JSON.stringify({
        query: { kind: 'HogQLQuery', query: sql },
        name: `hogql-${sql.slice(0, 40)}`
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

/** Query a Trends insight (time-series aggregation). */
async function _queryTrends(
  event: string,
  days = 30,
  interval: 'day' | 'week' = 'day'
): Promise<Array<{ date: string; count: number }> | null> {
  // Escape single quotes for SQL IN clause
  const q = "\\'";
  const escapedEvent = event.replaceAll(/'/g, q);
  const sql = [
    `SELECT toStartOf${interval === 'week' ? 'Week' : 'Day'}(timestamp) AS date,`,
    '       count(DISTINCT person_id) AS count',
    '    FROM events',
    `    WHERE event = '${escapedEvent}'`,
    `      AND timestamp >= now() - INTERVAL ${days} DAY`,
    '    GROUP BY date',
    '    ORDER BY date'
  ].join('\n');
  const result = await queryHogQL(sql);
  if (!result?.results) {
    return null;
  }
  return (result.results as [string, number][]).map(([date, count]) => ({
    date: (date || '').slice(0, 10),
    count: count ?? 0
  }));
}

/** Fetch a saved PostHog insight by its numeric ID or short_id. */
async function _getInsight(id: number | string): Promise<InsightResult | null> {
  if (!isConfigured()) {
    return null;
  }
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
async function _listInsights(search?: string): Promise<InsightResult[]> {
  if (!isConfigured()) {
    return [];
  }
  try {
    const params = new URLSearchParams({ limit: '50' });
    if (search) {
      params.set('search', search);
    }
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
