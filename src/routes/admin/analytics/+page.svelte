<script lang="ts">
  import { scaleBand } from 'd3-scale';
  import { BarChart } from 'layerchart';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart/index.js';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  let { data } = $props();

  const digest = data.weeklyDigest;
  const dailyTrend = data.dailyTrend ?? [];

  const chartConfig = {
    visitors: { label: 'Visitors', color: 'var(--chart-1)' },
    pageviews: { label: 'Page Views', color: 'var(--chart-2)' },
    sessions: { label: 'Sessions', color: 'var(--chart-3)' },
    events: { label: 'Events', color: 'var(--chart-1)' },
  } satisfies Chart.ChartConfig;

  function fmt(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  }
</script>

<div class="px-4 lg:px-6">
  <div class="mb-8">
    <h1 class="text-2xl font-semibold">Analytics</h1>
    <p class="text-muted-foreground text-sm">Web analytics from PostHog</p>
  </div>

  {#if !digest}
    <Card>
      <CardContent class="pt-6">
        <p class="text-muted-foreground text-center">PostHog analytics not configured.</p>
      </CardContent>
    </Card>
  {:else}
    <!-- Stat cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Visitors</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{fmt(digest.visitors.current)}</p>
          <p class="text-muted-foreground mt-1 text-xs">
            {digest.visitors.change.long_text}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Page Views</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{fmt(digest.pageviews.current)}</p>
          <p class="text-muted-foreground mt-1 text-xs">
            {digest.pageviews.change.long_text}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{fmt(digest.sessions.current)}</p>
          <p class="text-muted-foreground mt-1 text-xs">
            {digest.sessions.change.long_text}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Bounce Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{digest.bounce_rate.current}%</p>
          <p class="text-muted-foreground mt-1 text-xs">
            Previous: {digest.bounce_rate.previous}%
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Daily trend chart -->
    {#if dailyTrend.length > 0}
      <div class="mt-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-medium">Daily Events (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart.Container config={chartConfig} class="min-h-[200px] w-full">
              <BarChart
                data={dailyTrend}
                x="day"
                axis="x"
                seriesLayout="stack"
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
          </CardContent>
        </Card>
      </div>
    {/if}

    <!-- Top pages & sources -->
    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="text-sm font-medium">Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead class="text-right">Visitors</TableHead>
                <TableHead class="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each digest.top_pages.slice(0, 10) as page}
                <TableRow>
                  <TableCell class="font-medium">{page.path}</TableCell>
                  <TableCell class="text-right">{page.visitors}</TableCell>
                  <TableCell class="text-right">{page.change.percent}%</TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle class="text-sm font-medium">Top Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead class="text-right">Visitors</TableHead>
                <TableHead class="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each digest.top_sources.slice(0, 10) as source}
                <TableRow>
                  <TableCell class="font-medium">{source.name}</TableCell>
                  <TableCell class="text-right">{source.visitors}</TableCell>
                  <TableCell class="text-right">{source.change.percent}%</TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
