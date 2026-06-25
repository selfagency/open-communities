<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { invalidateAll } from '$app/navigation';
  import { m } from '$lib/paraglide/messages';

  interface PhChange { percent: number; direction: string; long_text: string; }
  interface PhMetric { current: number; change: PhChange; }
  interface Digest {
    visitors: PhMetric; pageviews: PhMetric; sessions: PhMetric;
    bounce_rate: PhMetric & { current: number; previous: number };
    avg_session_duration: PhMetric & { current: string; previous: string };
    top_pages: Array<{ path: string; visitors: number; change: PhChange | null }>;
    top_sources: Array<{ name: string; visitors: number; change: PhChange | null }>;
    goals: Array<{ name: string; conversions: number; change: PhChange }>;
    dashboard_url: string;
  }

  let {
    realtimeDigest,
    weekDigest,
    monthDigest,
  }: {
    realtimeDigest: Digest | null;
    weekDigest: Digest | null;
    monthDigest: Digest | null;
  } = $props();

  let viewMode = $state<'realtime' | 'week' | 'month'>('realtime');

  const digest = $derived(
    viewMode === 'realtime' ? realtimeDigest : viewMode === 'week' ? weekDigest : monthDigest
  );

  function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

  // Auto-refresh every 2 minutes in any mode
  $effect(() => {
    const interval = setInterval(() => { invalidateAll(); }, 120_000);
    return () => clearInterval(interval);
  });
</script>

{#if digest}
  <div class="flex items-center justify-between">
    <h3 class="font-serif text-2xl font-bold tracking-wider">{m.adminWebAnalytics()}</h3>
    <div class="flex gap-1 rounded-lg bg-muted p-1">
      <Button variant={viewMode === 'realtime' ? 'default' : 'ghost'} size="sm" class="h-7 px-3 text-xs" onclick={() => viewMode = 'realtime'}>{m.adminRealtime()}</Button>
      <Button variant={viewMode === 'week' ? 'default' : 'ghost'} size="sm" class="h-7 px-3 text-xs" onclick={() => viewMode = 'week'}>{m.adminWeek()}</Button>
      <Button variant={viewMode === 'month' ? 'default' : 'ghost'} size="sm" class="h-7 px-3 text-xs" onclick={() => viewMode = 'month'}>{m.adminMonth()}</Button>
    </div>
  </div>

  <div class="mt-4 grid gap-4 md:grid-cols-5">
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminVisitors()}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{fmt(digest.visitors.current)}</p>
        {#if digest.visitors.change && viewMode === 'week'}
          <p class="text-muted-foreground mt-1 text-xs">{digest.visitors.change.long_text}</p>
        {/if}
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminPageViews()}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{fmt(digest.pageviews.current)}</p>
        {#if digest.pageviews.change && viewMode === 'week'}
          <p class="text-muted-foreground mt-1 text-xs">{digest.pageviews.change.long_text}</p>
        {/if}
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminSessions()}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{fmt(digest.sessions.current)}</p>
        {#if digest.sessions.change && viewMode === 'week'}
          <p class="text-muted-foreground mt-1 text-xs">{digest.sessions.change.long_text}</p>
        {/if}
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminBounceRate()}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{digest.bounce_rate.current.toFixed(1)}%</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminAvgSession()}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{digest.avg_session_duration.current || '—'}</p>
      </CardContent>
    </Card>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminTopPages()}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="font-bold">{m.adminPage()}</TableHead>
              <TableHead class="text-right font-bold">{m.adminVisitors()}</TableHead>
              <TableHead class="text-right font-bold">{m.adminChange()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each digest.top_pages.slice(0, 10) as page}
              <TableRow>
                <TableCell class="font-medium">{page.path || '/'}</TableCell>
                <TableCell class="text-right">{page.visitors}</TableCell>
                <TableCell class="text-right">{page.change?.percent ?? 0}%</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminTopSources()}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="font-bold">{m.adminSource()}</TableHead>
              <TableHead class="text-right font-bold">{m.adminVisitors()}</TableHead>
              <TableHead class="text-right font-bold">{m.adminChange()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each digest.top_sources.slice(0, 10) as source}
              <TableRow>
                <TableCell class="font-medium">{source.name}</TableCell>
                <TableCell class="text-right">{source.visitors}</TableCell>
                <TableCell class="text-right">{source.change?.percent ?? 0}%</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
{/if}
