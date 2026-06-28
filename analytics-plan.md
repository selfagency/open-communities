# Analytics Dashboard & Pa11y Plan

## Pa11y Integration

Add accessibility checks to the CI workflow using the `pa11y-ci` CLI directly (the GitHub Action is too basic — it runs `npm install && npm start` which doesn't match our build process).

**Approach:** Add a step in the E2E job that runs `pa11y-ci` against the running preview server after Playwright tests complete.

```yaml
- name: Run accessibility checks
  run: |
    npx pa11y-ci --sitemap http://localhost:4173/sitemap.xml --sitemap-find .html --sitemap-replace ''
  continue-on-error: true
```

Since we don't have a sitemap, we'll run pa11y against specific URLs:

```yaml
- name: Run accessibility checks
  run: |
    npx pa11y-ci --urls "http://localhost:4173/ http://localhost:4173/admin http://localhost:4173/admin/congregations http://localhost:4173/admin/users http://localhost:4173/admin/approvals http://localhost:4173/admin/analytics http://localhost:4173/admin/pages http://localhost:4173/admin/settings"
  continue-on-error: true
```

## Analytics Dashboard Plan

### Current State
- PostHog is already collecting events: `$pageview`, `user_signed_up`, `congregation_submitted`, `search_performed`
- PostHog has a `web_analytics/weekly_digest` API endpoint that returns aggregated stats
- The admin analytics page currently shows only static stat cards

### Goal: Umami-like Dashboard

Build an in-app analytics dashboard using PostHog's API, displayed with shadcn-svelte Chart components. No separate analytics service needed — PostHog already has the data.

### Architecture

```
Admin Server (src/routes/admin/analytics/+page.server.ts)
  ↓
PostHog REST API (personal API key)
  - GET /api/projects/:id/web_analytics/weekly_digest?days=30
  - POST /api/projects/:id/query/ (HogQL for custom queries)
  ↓
Client (src/routes/admin/analytics/+page.svelte)
  - shadcn-svelte Chart components (recharts)
  - Date range picker
  - Stat cards with period-over-period comparisons
```

### Data Sources

| Metric | API Endpoint | Notes |
|--------|-------------|-------|
| Unique visitors | `web_analytics/weekly_digest` | Current vs previous period |
| Pageviews | `web_analytics/weekly_digest` | Total + trend |
| Sessions | `web_analytics/weekly_digest` | Total + trend |
| Bounce rate | `web_analytics/weekly_digest` | Percentage + trend |
| Avg session duration | `web_analytics/weekly_digest` | Seconds + trend |
| Top pages | `web_analytics/weekly_digest` | Top 5 by visitors |
| Top sources | `web_analytics/weekly_digest` | Top 5 by visitors |
| Daily trend (30d) | `POST /query` HogQL | `SELECT count(), timestamp FROM events` |
| User signups | `POST /query` HogQL | `SELECT count() FROM events WHERE event='user_signed_up'` |
| Congregation submissions | `POST /query` HogQL | `SELECT count() FROM events WHERE event='congregation_submitted'` |

### Implementation

**1. Server-side PostHog client** (`src/lib/server/posthog-api.ts`):
```typescript
import { env } from '$env/dynamic/private';

const PH_API_KEY = env.POSTHOG_PERSONAL_API_KEY;
const PH_PROJECT_ID = env.POSTHOG_PROJECT_ID;
const PH_HOST = env.PUBLIC_POSTHOG_HOST || 'https://us.posthog.com';

export async function getWeeklyDigest(days = 7) {
  const res = await fetch(
    `${PH_HOST}/api/projects/${PH_PROJECT_ID}/web_analytics/weekly_digest/?days=${days}`,
    { headers: { Authorization: `Bearer ${PH_API_KEY}` } }
  );
  return res.json();
}

export async function queryHogQL(sql: string) {
  const res = await fetch(
    `${PH_HOST}/api/projects/${PH_PROJECT_ID}/query/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PH_API_KEY}`
      },
      body: JSON.stringify({
        query: { kind: 'HogQLQuery', query: sql }
      })
    }
  );
  return res.json();
}
```

**2. Analytics page server** (`src/routes/admin/analytics/+page.server.ts`):
- Fetch weekly digest for 30-day window
- Fetch daily event counts for trend chart
- Fetch signup/submission counts
- Cache results for 5 minutes

**3. Analytics page client** (`src/routes/admin/analytics/+page.svelte`):
- Stat cards with period-over-period comparison (up/down arrows)
- Daily trend line chart (shadcn-svelte Chart)
- Top pages table
- Top sources table
- Date range selector (7d, 30d, 90d)

### Required Env Vars
```
POSTHOG_PERSONAL_API_KEY=phx_...  # PostHog personal API key with query:read scope
POSTHOG_PROJECT_ID=12345          # PostHog project ID
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/lib/server/posthog-api.ts` | Create — PostHog API client |
| `src/routes/admin/analytics/+page.server.ts` | Rewrite — fetch real data |
| `src/routes/admin/analytics/+page.svelte` | Rewrite — charts + stats |
| `.github/workflows/ci.yml` | Add pa11y step to E2E job |
| `.env.dynamic` | Add POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID |

### Effort: ~2-3 hours
