import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/logger', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
  log: { error: () => {} }
}));

// Controller for credential state — set __PH_CREDENTIALS before each test
const credentials = vi.hoisted(() => {
  const store: Record<string, string> = {
    POSTHOG_CLI_API_KEY: 'phx_test_key',
    POSTHOG_CLI_HOST: 'http://localhost:3001',
    POSTHOG_CLI_PROJECT_ID: '212770'
  };
  return store;
});

vi.mock('$env/dynamic/private', () => ({
  env: {
    ADMIN_EMAIL: 'admin@test.local',
    CAPTCHA_SITE_SECRET: '',
    MAILGUN_API_KEY: 'test-key',
    MAILGUN_DOMAIN: 'm.opencommunities.info',
    get POSTHOG_CLI_API_KEY() {
      return credentials.POSTHOG_CLI_API_KEY;
    },
    get POSTHOG_CLI_HOST() {
      return credentials.POSTHOG_CLI_HOST;
    },
    get POSTHOG_CLI_PROJECT_ID() {
      return credentials.POSTHOG_CLI_PROJECT_ID;
    }
  }
}));

const mockDigest = {
  avg_session_duration: {
    change: { color: 'green', direction: 'Up', long_text: 'increased 16%', percent: 16.67, text: '↑16.67%' },
    current: '2m 30s',
    previous: '3m 00s'
  },
  bounce_rate: {
    change: { color: 'green', direction: 'Up', long_text: 'improved 6%', percent: 6.03, text: '↑6.03%' },
    current: 45.2,
    previous: 48.1
  },
  dashboard_url: 'https://us.posthog.com/project/212770/web',
  goals: [],
  pageviews: {
    change: { color: 'green', direction: 'Up', long_text: 'increased 14%', percent: 14.29, text: '↑14.29%' },
    current: 1200,
    previous: 1050
  },
  sessions: {
    change: { color: 'green', direction: 'Up', long_text: 'increased 13%', percent: 13.33, text: '↑13.33%' },
    current: 340,
    previous: 300
  },
  top_pages: [{ change: null, host: 'example.com', path: '/', visitors: 500 }],
  top_sources: [{ change: null, name: 'direct', visitors: 200 }],
  visitors: {
    change: { color: 'green', direction: 'Up', long_text: 'increased 11%', percent: 11.11, text: '↑11.11%' },
    current: 800,
    previous: 720
  }
};

describe('posthog-api', () => {
  afterEach(() => {
    // Restore credentials to configured state
    credentials.POSTHOG_CLI_API_KEY = 'phx_test_key';
    credentials.POSTHOG_CLI_PROJECT_ID = '212770';
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('returns null when credentials are not configured', async () => {
    credentials.POSTHOG_CLI_API_KEY = '';
    credentials.POSTHOG_CLI_PROJECT_ID = '';
    vi.resetModules();
    const { getWeeklyDigest } = await import('$lib/server/posthog-api');
    await expect(getWeeklyDigest()).resolves.toBeNull();
  });

  it('returns WeeklyDigest on successful fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => mockDigest,
        ok: true
      })
    );
    const { getWeeklyDigest } = await import('$lib/server/posthog-api');
    const result = await getWeeklyDigest();
    expect(result).not.toBeNull();
    expect(result!.visitors.current).toBe(800);
    expect(result!.pageviews.current).toBe(1200);
  });

  it('returns null when API returns non-ok status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      })
    );
    const { getWeeklyDigest } = await import('$lib/server/posthog-api');
    await expect(getWeeklyDigest()).resolves.toBeNull();
  });

  it('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    const { getWeeklyDigest } = await import('$lib/server/posthog-api');
    await expect(getWeeklyDigest()).resolves.toBeNull();
  });
});
