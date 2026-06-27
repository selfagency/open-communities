/** Change direction and percentage from PostHog. */
export interface PhChange {
  color: string;
  direction: 'Up' | 'Down';
  long_text: string;
  percent: number;
  text: string;
}

/** Metric with before/after comparison. */
export interface PhMetric {
  change: PhChange;
  current: number;
  previous: number;
}

/** Weekly digest response shape from PostHog web analytics. */
export interface Digest {
  avg_session_duration: { change: PhChange; current: string; previous: string };
  bounce_rate: PhMetric;
  dashboard_url: string;
  goals: Array<{ name: string; conversions: number; change: PhChange }>;
  pageviews: PhMetric;
  sessions: PhMetric;
  top_pages: Array<{ host: string; path: string; visitors: number; change: PhChange | null }>;
  top_sources: Array<{ name: string; visitors: number; change: PhChange | null }>;
  visitors: PhMetric;
}
