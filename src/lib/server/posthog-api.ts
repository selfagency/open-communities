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

// PostHogInsight and InsightResult were removed as unused.
// See commit history to restore if needed.

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
    log.error('PostHog weekly digest error', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// queryHogQL was removed as unused (the only callers were _queryTrends/_getInsight).
// See commit history to restore if needed.

// _queryTrends, _getInsight, and _listInsights were removed as unused.
// See commit history to restore if needed.
