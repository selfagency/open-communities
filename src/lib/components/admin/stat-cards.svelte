<script lang="ts">
  import CongregationsIcon from '@tabler/icons-svelte/icons/buildings';
  import ThumbsUpIcon from '@tabler/icons-svelte/icons/circle-check';
  import UsersIcon from '@tabler/icons-svelte/icons/users';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

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
  <a href="/admin/congregations" class="block cursor-pointer no-underline">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">Pending Approvals</CardTitle>
        <ThumbsUpIcon class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{pendingApprovals}</p>
      </CardContent>
    </Card>
  </a>
  <a href="/admin/congregations" class="block cursor-pointer no-underline">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">Congregations</CardTitle>
        <CongregationsIcon class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{congregations}</p>
      </CardContent>
    </Card>
  </a>
  <a href="/admin/users" class="block cursor-pointer no-underline">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">Users</CardTitle>
        <UsersIcon class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{users}</p>
      </CardContent>
    </Card>
  </a>
</div>

{#if topCountries.length > 0 || topStates.length > 0}
  <div class="mt-6 grid gap-6 md:grid-cols-2">
    {#if topCountries.length > 0}
      <Card>
        <CardHeader>
          <CardTitle class="font-serif text-lg font-bold tracking-wider">Top Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="font-bold">Country</TableHead>
                <TableHead class="text-right font-bold">Congregations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each topCountries as c}
                <TableRow>
                  <TableCell class="font-medium">{c.name}</TableCell>
                  <TableCell class="text-right">{c.count}</TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    {/if}
    {#if topStates.length > 0}
      <Card>
        <CardHeader>
          <CardTitle class="font-serif text-lg font-bold tracking-wider">Top US States</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="font-bold">State</TableHead>
                <TableHead class="text-right font-bold">Congregations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each topStates as s}
                <TableRow>
                  <TableCell class="font-medium">{s.name}</TableCell>
                  <TableCell class="text-right">{s.count}</TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    {/if}
  </div>
{/if}
