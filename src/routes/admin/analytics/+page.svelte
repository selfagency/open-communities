<script lang="ts">
  import Activity from '@lucide/svelte/icons/activity';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
  import Building2 from '@lucide/svelte/icons/building-2';
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
  import Globe from '@lucide/svelte/icons/globe';
  import MousePointerClick from '@lucide/svelte/icons/mouse-pointer-click';
  import Users from '@lucide/svelte/icons/users';
  import { LineChart } from 'layerchart';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  let { data } = $props();

  const chartConfig = {
    events: { label: 'Events', color: 'var(--color-chart-1)' },
  } satisfies Chart.ChartConfig;

  function directionIcon(dir: string) {
    if (dir === 'Up') return ArrowUp;
    if (dir === 'Down') return ArrowDown;
    return Activity;
  }

  function renderChange(change: { direction: string; text: string }) {
    const Icon = directionIcon(change.direction);
    return `<span class="flex items-center gap-1 text-xs text-muted-foreground">
      ${Icon === ArrowUp ? '↑' : Icon === ArrowDown ? '↓' : '→'}
      ${change.text}
    </span>`;
  }
</script>

<div class="space-y-4">
  <h1 class="text-2xl font-bold">Analytics</h1>

  {#if !data.phConfigured}
    <Card>
      <CardContent class="py-8 text-center text-muted-foreground">
        PostHog analytics not configured. Set <code class="text-xs">POSTHOG_CLI_API_KEY</code> and
        <code class="text-xs">POSTHOG_CLI_PROJECT_ID</code> to enable analytics.
      </CardContent>
    </Card>
  {/if}

  <!-- App Stats -->
  <div class="grid gap-4 md:grid-cols-3">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Congregations</CardTitle>
        <Building2 class="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{data.stats.congregations}</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Users</CardTitle>
        <Users class="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{data.stats.users}</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Pending Approvals</CardTitle>
        <ClipboardCheck class="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{data.stats.pendingApprovals}</p>
      </CardContent>
    </Card>
  </div>

  {#if data.phDigest}
    <!-- Web Analytics Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Visitors</CardTitle>
          <Globe class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{data.phDigest.visitors.current.toLocaleString()}</p>
          <p class="flex items-center gap-1 text-xs text-muted-foreground">
            {#if data.phDigest.visitors.change.direction === 'Up'}
              <ArrowUp class="size-3" />
            {:else if data.phDigest.visitors.change.direction === 'Down'}
              <ArrowDown class="size-3" />
            {:else}
              <Activity class="size-3" />
            {/if}
            {data.phDigest.visitors.change.text}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Pageviews</CardTitle>
          <MousePointerClick class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{data.phDigest.pageviews.current.toLocaleString()}</p>
          <p class="flex items-center gap-1 text-xs text-muted-foreground">
            {#if data.phDigest.pageviews.change.direction === 'Up'}
              <ArrowUp class="size-3" />
            {:else if data.phDigest.pageviews.change.direction === 'Down'}
              <ArrowDown class="size-3" />
            {:else}
              <Activity class="size-3" />
            {/if}
            {data.phDigest.pageviews.change.text}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Sessions</CardTitle>
          <Activity class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{data.phDigest.sessions.current.toLocaleString()}</p>
          <p class="flex items-center gap-1 text-xs text-muted-foreground">
            {#if data.phDigest.sessions.change.direction === 'Up'}
              <ArrowUp class="size-3" />
            {:else if data.phDigest.sessions.change.direction === 'Down'}
              <ArrowDown class="size-3" />
            {:else}
              <Activity class="size-3" />
            {/if}
            {data.phDigest.sessions.change.text}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Bounce Rate</CardTitle>
          <BarChart3 class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{data.phDigest.bounce_rate.current.toFixed(1)}%</p>
          <p class="flex items-center gap-1 text-xs text-muted-foreground">
            {#if data.phDigest.bounce_rate.change.direction === 'Up'}
              <ArrowUp class="size-3" />
            {:else if data.phDigest.bounce_rate.change.direction === 'Down'}
              <ArrowDown class="size-3" />
            {:else}
              <Activity class="size-3" />
            {/if}
            {data.phDigest.bounce_rate.change.text}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Chart -->
    <Card>
      <CardHeader>
        <CardTitle>Daily Trend</CardTitle>
        <CardDescription>Events over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {#if data.dailyTrend.length > 0}
          <Chart.Container config={chartConfig} class="aspect-[3/1]">
            <LineChart data={data.dailyTrend} x="day" y="events">
              <Chart.Tooltip />
            </LineChart>
          </Chart.Container>
        {:else}
          <p class="text-sm text-muted-foreground">No event data available.</p>
        {/if}
      </CardContent>
    </Card>

    <!-- Top Pages & Sources -->
    <div class="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Most visited pages</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead class="text-right">Visitors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each data.phDigest.top_pages as page}
                <TableRow>
                  <TableCell class="font-mono text-xs">{page.path}</TableCell>
                  <TableCell class="text-right">{page.visitors}</TableCell>
                </TableRow>
              {:else}
                <TableRow>
                  <TableCell colspan={2} class="text-center text-muted-foreground">
                    No data
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top Sources</CardTitle>
          <CardDescription>Where visitors come from</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead class="text-right">Visitors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each data.phDigest.top_sources as source}
                <TableRow>
                  <TableCell>{source.name || 'Direct'}</TableCell>
                  <TableCell class="text-right">{source.visitors}</TableCell>
                </TableRow>
              {:else}
                <TableRow>
                  <TableCell colspan={2} class="text-center text-muted-foreground">
                    No data
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
