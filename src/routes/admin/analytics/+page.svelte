<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Building2 from '@lucide/svelte/icons/building-2';
  import Users from '@lucide/svelte/icons/users';
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';

  let { data } = $props();
</script>

<div class="space-y-4">
  <h1 class="text-2xl font-bold">Analytics</h1>

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

  <Card>
    <CardHeader>
      <CardTitle>PostHog Analytics</CardTitle>
      <CardDescription>View detailed analytics in the PostHog dashboard.</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="text-muted-foreground">
        Detailed analytics including page views, user signups, congregation submissions, and retention metrics are available in PostHog.
      </p>
    </CardContent>
  </Card>
</div>
