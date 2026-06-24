<script lang="ts">
  import { scaleBand } from 'd3-scale';
  import { BarChart, LineChart } from 'layerchart';
  import * as Chart from '$lib/components/ui/chart/index.js';

  let { data } = $props();

  const digest = data.weeklyDigest;
  const dailyTrend = data.dailyTrend ?? [];

  const chartConfig = {
    visitors: { label: 'Visitors', color: 'var(--chart-1)' },
    pageviews: { label: 'Page Views', color: 'var(--chart-2)' },
    sessions: { label: 'Sessions', color: 'var(--chart-3)' },
    events: { label: 'Events', color: 'var(--chart-1)' },
  } satisfies Chart.ChartConfig;

  function fmt(num: number) {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
  }

  function dir(n: number) { return n >= 0 ? 'up' : 'down'; }
</script>

<div class="px-4 lg:px-6">
  <div class="mb-8">
    <h1 class="text-2xl font-semibold">Analytics</h1>
    <p class="text-muted-foreground text-sm">Web analytics from PostHog</p>
  </div>

  {#if !digest}
    <div class="bg-card text-card-foreground rounded-xl border p-8 text-center shadow-xs">
      <p class="text-muted-foreground">PostHog analytics not configured.</p>
    </div>
  {:else}
    <!-- Stat cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
        <p class="text-muted-foreground text-sm font-medium">Visitors</p>
        <p class="mt-2 text-3xl font-bold">{fmt(digest.visitors.current)}</p>
        <p class="mt-1 text-xs text-{dir(digest.visitors.change.percent)}-500">
          {digest.visitors.change.percent}% {digest.visitors.change.direction === 'Up' ? '↑' : '↓'}
        </p>
      </div>
      <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
        <p class="text-muted-foreground text-sm font-medium">Page Views</p>
        <p class="mt-2 text-3xl font-bold">{fmt(digest.pageviews.current)}</p>
        <p class="mt-1 text-xs text-{dir(digest.pageviews.change.percent)}-500">
          {digest.pageviews.change.percent}% {digest.pageviews.change.direction === 'Up' ? '↑' : '↓'}
        </p>
      </div>
      <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
        <p class="text-muted-foreground text-sm font-medium">Sessions</p>
        <p class="mt-2 text-3xl font-bold">{fmt(digest.sessions.current)}</p>
        <p class="mt-1 text-xs text-{dir(digest.sessions.change.percent)}-500">
          {digest.sessions.change.percent}% {digest.sessions.change.direction === 'Up' ? '↑' : '↓'}
        </p>
      </div>
      <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
        <p class="text-muted-foreground text-sm font-medium">Bounce Rate</p>
        <p class="mt-2 text-3xl font-bold">{digest.bounce_rate.current}%</p>
        <p class="mt-1 text-xs text-muted-foreground">
          Prev: {digest.bounce_rate.previous}%
        </p>
      </div>
    </div>

    <!-- Daily trend chart -->
    {#if dailyTrend.length > 0}
      <div class="mt-6">
        <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
          <h3 class="mb-4 text-sm font-medium">Daily Events (30 days)</h3>
          <Chart.Container {config} chartConfig class="min-h-[200px] w-full">
            <BarChart
              data={dailyTrend}
              x="day"
              axis="x"
              seriesLayout="stacked"
              legend
              series={[
                { key: 'events', label: 'Events', color: 'var(--chart-1)' },
              ]}
              props={{
                xAxis: { format: (d: string) => d?.slice(5) ?? '' },
              }}
            >
              {#snippet tooltip()}
                <Chart.Tooltip />
              {/snippet}
            </BarChart>
          </Chart.Container>
        </div>
      </div>
    {/if}

    <!-- Top pages & sources -->
    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
        <h3 class="mb-4 text-sm font-medium">Top Pages</h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground border-b text-left">
              <th class="pb-2 font-medium">Page</th>
              <th class="pb-2 font-medium">Visitors</th>
              <th class="pb-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {#each digest.top_pages.slice(0, 10) as page}
              <tr class="border-b last:border-0">
                <td class="py-2">{page.path}</td>
                <td class="py-2">{page.visitors}</td>
                <td class="py-2 text-{dir(page.change.percent)}-500">
                  {page.change.percent}%
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
        <h3 class="mb-4 text-sm font-medium">Top Sources</h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground border-b text-left">
              <th class="pb-2 font-medium">Source</th>
              <th class="pb-2 font-medium">Visitors</th>
              <th class="pb-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {#each digest.top_sources.slice(0, 10) as source}
              <tr class="border-b last:border-0">
                <td class="py-2">{source.name}</td>
                <td class="py-2">{source.visitors}</td>
                <td class="py-2 text-{dir(source.change.percent)}-500">
                  {source.change.percent}%
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
