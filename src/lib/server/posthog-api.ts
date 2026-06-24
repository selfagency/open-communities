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
  top_pages: Array<{ host: string; path: string; visitors: number; change: PhChange }>;
  top_sources: Array<{ name: string; visitors: number; change: PhChange }>;
  goals: Array<{ name: string; conversions: number; change: PhChange }>;
  dashboard_url: string;
}

interface HogQLResult {
  results: Array<Array<unknown>>;
  columns: string[];
  types: string[];
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

/** Format a duration string like "2m 30s" into a human-readable form. */
export function formatDuration(duration: string): string {
  if (!duration) return '—';
  return duration;
}
