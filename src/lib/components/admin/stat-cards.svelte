<script lang="ts">
  import ChurchIcon from '@tabler/icons-svelte/icons/building';
  import ThumbsUpIcon from '@tabler/icons-svelte/icons/thumb-up';
  import UsersIcon from '@tabler/icons-svelte/icons/users';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  let { congregations = 0, users = 0, pendingApprovals = 0 }: {
    congregations: number;
    users: number;
    pendingApprovals: number;
  } = $props();
</script>

<div class="grid gap-4 md:grid-cols-3">
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="text-sm font-medium">Congregations</CardTitle>
      <ChurchIcon class="text-muted-foreground size-4" />
    </CardHeader>
    <CardContent>
      <p class="text-3xl font-bold">{congregations}</p>
    </CardContent>
  </Card>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="text-sm font-medium">Users</CardTitle>
      <UsersIcon class="text-muted-foreground size-4" />
    </CardHeader>
    <CardContent>
      <p class="text-3xl font-bold">{users}</p>
    </CardContent>
  </Card>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="text-sm font-medium">Pending Approvals</CardTitle>
      <ThumbsUpIcon class="text-muted-foreground size-4" />
    </CardHeader>
    <CardContent>
      <p class="text-3xl font-bold">{pendingApprovals}</p>
    </CardContent>
  </Card>
</div>
