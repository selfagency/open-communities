<script lang="ts">
  import ChurchIcon from '@lucide/svelte/icons/church';
  import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  let { data } = $props();
  const stats = data.stats;
</script>

<div class="px-4 lg:px-6">
  <div class="mb-8">
    <h1 class="text-2xl font-semibold">Dashboard</h1>
    <p class="text-muted-foreground text-sm">Overview of your community</p>
  </div>

  <div class="grid gap-4 md:grid-cols-3">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Congregations</CardTitle>
        <ChurchIcon class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{stats.congregations}</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Users</CardTitle>
        <UsersIcon class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{stats.users}</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="text-sm font-medium">Pending Approvals</CardTitle>
        <ThumbsUpIcon class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{stats.pendingApprovals}</p>
      </CardContent>
    </Card>
  </div>
</div>
