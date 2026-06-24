<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Building2 from '@lucide/svelte/icons/building-2';
  import Users from '@lucide/svelte/icons/users';
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';

  let { data } = $props();
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium">Total Congregations</CardTitle>
      <Building2 class="size-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <p class="text-3xl font-bold">{data.stats.congregations}</p>
    </CardContent>
  </Card>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium">Total Users</CardTitle>
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
