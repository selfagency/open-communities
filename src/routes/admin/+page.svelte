<script lang="ts">
  import ChurchIcon from '@tabler/icons-svelte/icons/building';
  import ThumbsUpIcon from '@tabler/icons-svelte/icons/thumb-up';
  import UsersIcon from '@tabler/icons-svelte/icons/users';
  import { scaleBand } from 'd3-scale';
  import { BarChart } from 'layerchart';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart/index.js';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  let { data } = $props();
  const stats = data.stats;
  const digest = data.weeklyDigest;
  const dailyTrend = data.dailyTrend ?? [];

  const chartConfig = {
    events: { label: 'Events', color: 'var(--chart-1)' },
  } satisfies Chart.ChartConfig;

  function fmt(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  }
</script>

<div class="space-y-8">
  <!-- Stat cards -->
  <div class="grid gap-4 md:grid-cols-3">
    <Card class="group">
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Congregations</CardTitle>
        <ChurchIcon class="text-muted-foreground size-4 transition-transform duration-200 motion-safe:group-hover:scale-110" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{stats.congregations}</p>
      </CardContent>
    </Card>
    <Card class="group">
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Users</CardTitle>
        <UsersIcon class="text-muted-foreground size-4 transition-transform duration-200 motion-safe:group-hover:scale-110" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{stats.users}</p>
      </CardContent>
    </Card>
    <Card class="group">
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Pending Approvals</CardTitle>
        <ThumbsUpIcon class="text-muted-foreground size-4 transition-transform duration-200 motion-safe:group-hover:scale-110" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{stats.pendingApprovals}</p>
      </CardContent>
    </Card>
  </div>

  <!-- Analytics section -->
  {#if digest}
    <!-- Web stat cards -->
    <div>
      <h2 class="mb-4 text-lg font-semibold">Analytics</h2>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">{fmt(digest.visitors.current)}</p>
            <p class="text-muted-foreground mt-1 text-xs">{digest.visitors.change.long_text}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">{fmt(digest.pageviews.current)}</p>
            <p class="text-muted-foreground mt-1 text-xs">{digest.pageviews.change.long_text}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">{fmt(digest.sessions.current)}</p>
            <p class="text-muted-foreground mt-1 text-xs">{digest.sessions.change.long_text}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-3xl font-bold">{digest.bounce_rate.current}%</p>
            <p class="text-muted-foreground mt-1 text-xs">Previous: {digest.bounce_rate.previous}%</p>
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
    </div>
  {/if}
</div>
