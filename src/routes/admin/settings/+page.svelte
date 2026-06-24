<script lang="ts">
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
  import Database from '@lucide/svelte/icons/database';
  import Mail from '@lucide/svelte/icons/mail';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import Server from '@lucide/svelte/icons/server';
  import { toast } from 'svelte-sonner';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';

  let { data } = $props();

  function clearCache() {
    fetch('/admin/settings/clear-cache', { method: 'POST' })
      .then(() => toast.success('Cache cleared'))
      .catch(() => toast.error('Failed to clear cache'));
  }
</script>

<div class="space-y-4">
  <h1 class="text-2xl font-bold">Settings</h1>

  <div class="grid gap-4 md:grid-cols-2">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Node.js</CardTitle>
        <Server class="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p class="text-lg font-mono">{data.nodeVersion}</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">SMTP</CardTitle>
        <Mail class="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Badge variant="default">Connected</Badge>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">PostHog</CardTitle>
        <BarChart3 class="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Badge variant="default">Configured</Badge>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">PocketBase</CardTitle>
        <Database class="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Badge variant="default">Connected</Badge>
      </CardContent>
    </Card>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Cache</CardTitle>
      <CardDescription>Clear server-side caches to force fresh data loads.</CardDescription>
    </CardHeader>
    <CardContent>
      <Button variant="outline" onclick={clearCache}>
        <RefreshCw class="mr-1 size-4" /> Clear All Caches
      </Button>
    </CardContent>
  </Card>
</div>
