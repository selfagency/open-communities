<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  let { data }: { data: { nodeVersion: string; smtpHost: string; smtpPort: string; posthogHost: string; pocketBaseUrl: string } } = $props();
  let clearing = $state(false);

  async function clearCache() {
    clearing = true;
    try { await fetch('/api/admin/cache/clear', { method: 'POST' }); alert('Cache cleared'); } catch { alert('Failed to clear cache'); }
    clearing = false;
  }
</script>

<div class="space-y-8">
  <div class="grid gap-6 md:grid-cols-2">
    <Card><CardHeader><CardTitle class="text-sm font-medium">Node.js</CardTitle></CardHeader><CardContent><p class="font-mono text-sm">{data.nodeVersion}</p></CardContent></Card>
    <Card><CardHeader><CardTitle class="text-sm font-medium">SMTP</CardTitle></CardHeader><CardContent><p class="font-mono text-sm">{data.smtpHost}:{data.smtpPort || '—'}</p></CardContent></Card>
    <Card><CardHeader><CardTitle class="text-sm font-medium">PostHog</CardTitle></CardHeader><CardContent><p class="font-mono text-sm">{data.posthogHost}</p></CardContent></Card>
    <Card><CardHeader><CardTitle class="text-sm font-medium">PocketBase</CardTitle></CardHeader><CardContent><p class="font-mono text-sm">{data.pocketBaseUrl}</p></CardContent></Card>
  </div>
  <Card>
    <CardHeader><CardTitle class="text-sm font-medium">Cache</CardTitle></CardHeader>
    <CardContent><Button variant="outline" onclick={clearCache} disabled={clearing}>{clearing ? 'Clearing...' : 'Clear Cache'}</Button></CardContent>
  </Card>
</div>
