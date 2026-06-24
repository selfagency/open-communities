<script lang="ts">
  import ChurchIcon from '@tabler/icons-svelte/icons/building';
  import ThumbsUpIcon from '@tabler/icons-svelte/icons/thumb-up';
  import UsersIcon from '@tabler/icons-svelte/icons/users';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  let {
    congregations = 0,
    users = 0,
    pendingApprovals = 0,
    topCountries = [],
    topStates = [],
  }: {
    congregations: number;
    users: number;
    pendingApprovals: number;
    topCountries?: Array<{ name: string; count: number }>;
    topStates?: Array<{ name: string; count: number }>;
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

{#if topCountries.length > 0 || topStates.length > 0}
  <div class="mt-6 grid gap-6 md:grid-cols-2">
    {#if topCountries.length > 0}
      <Card>
        <CardHeader>
          <CardTitle class="text-sm font-medium">Top Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            {#each topCountries as c}
              <div class="flex items-center justify-between">
                <span class="text-sm">{c.name}</span>
                <span class="text-muted-foreground text-sm font-medium">{c.count}</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}
    {#if topStates.length > 0}
      <Card>
        <CardHeader>
          <CardTitle class="text-sm font-medium">Top US States</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            {#each topStates as s}
              <div class="flex items-center justify-between">
                <span class="text-sm">{s.name}</span>
                <span class="text-muted-foreground text-sm font-medium">{s.count}</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}
  </div>
{/if}
