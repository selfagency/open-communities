<script lang="ts">
import BuildingBankIcon from '@tabler/icons-svelte/icons/building-bank';
import BuildingsCommunityIcon from '@tabler/icons-svelte/icons/building-community';
import ThumbsUpIcon from '@tabler/icons-svelte/icons/circle-check';
import UsersIcon from '@tabler/icons-svelte/icons/users';
import UsersGroupIcon from '@tabler/icons-svelte/icons/users-group';
import WorldIcon from '@tabler/icons-svelte/icons/world';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Skeleton } from '$lib/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
import { m } from '$lib/paraglide/messages';

let {
  congregations = 0,
  users = 0,
  pendingApprovals = 0,
  topCountries = [],
  topStates = [],
  topCities = [],
  totalCities = 0,
  totalStates = 0,
  totalCountries = 0,
  geoLoaded = false
}: {
  congregations: number;
  users: number;
  pendingApprovals: number;
  topCountries?: Array<{ name: string; count: number }>;
  topStates?: Array<{ name: string; count: number }>;
  topCities?: Array<{ name: string; count: number }>;
  totalCities?: number;
  totalStates?: number;
  totalCountries?: number;
  geoLoaded?: boolean;
} = $props();
</script>

<div class="grid gap-4 md:grid-cols-3">
  <a class="block cursor-pointer no-underline" href="/admin/congregations">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminPendingApprovals()}</CardTitle>
        <ThumbsUpIcon class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{pendingApprovals}</p>
      </CardContent>
    </Card>
  </a>
  <a class="block cursor-pointer no-underline" href="/admin/congregations">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminCongregations()}</CardTitle>
        <UsersGroupIcon class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{congregations}</p>
      </CardContent>
    </Card>
  </a>
  <a class="block cursor-pointer no-underline" href="/admin/users">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminUsers()}</CardTitle>
        <UsersIcon class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p class="text-3xl font-bold">{users}</p>
      </CardContent>
    </Card>
  </a>
</div>

<!-- Total stats row: City > State/Region > Country -->
<div class="mt-6 grid gap-6 md:grid-cols-3">
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminTotalCities()}</CardTitle>
      <BuildingsCommunityIcon class="text-muted-foreground size-5" />
    </CardHeader>
    <CardContent>
      {#if geoLoaded}
        <p class="text-3xl font-bold">{totalCities}</p>
      {:else}
        <Skeleton class="h-10 w-20" />
      {/if}
    </CardContent>
  </Card>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminTotalStates()}</CardTitle>
      <BuildingBankIcon class="text-muted-foreground size-5" />
    </CardHeader>
    <CardContent>
      {#if geoLoaded}
        <p class="text-3xl font-bold">{totalStates}</p>
      {:else}
        <Skeleton class="h-10 w-20" />
      {/if}
    </CardContent>
  </Card>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminTotalCountries()}</CardTitle>
      <WorldIcon class="text-muted-foreground size-5" />
    </CardHeader>
    <CardContent>
      {#if geoLoaded}
        <p class="text-3xl font-bold">{totalCountries}</p>
      {:else}
        <Skeleton class="h-10 w-20" />
      {/if}
    </CardContent>
  </Card>
</div>

<!-- Top stats row: City > State/Region > Country -->
<div class="mt-6 grid gap-6 md:grid-cols-3">
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminTopCities()}</CardTitle>
      <BuildingsCommunityIcon class="text-muted-foreground size-5" />
    </CardHeader>
    <CardContent>
      {#if geoLoaded}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="font-bold">{m.adminCity()}</TableHead>
              <TableHead class="text-right font-bold">{m.adminCongregationCount()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each topCities as c}
              <TableRow>
                <TableCell class="font-medium">{c.name}</TableCell>
                <TableCell class="text-right">{c.count}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {:else}
        <div class="space-y-2">
          {#each new Array(5) as _}
            <Skeleton class="h-8 w-full" />
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminTopStates()}</CardTitle>
      <BuildingBankIcon class="text-muted-foreground size-5" />
    </CardHeader>
    <CardContent>
      {#if geoLoaded}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="font-bold">{m.adminState()}</TableHead>
              <TableHead class="text-right font-bold">{m.adminCongregationCount()}</TableHead>
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
      {:else}
        <div class="space-y-2">
          {#each new Array(5) as _}
            <Skeleton class="h-8 w-full" />
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle class="font-serif text-lg font-bold tracking-wider">{m.adminTopCountries()}</CardTitle>
      <WorldIcon class="text-muted-foreground size-5" />
    </CardHeader>
    <CardContent>
      {#if geoLoaded}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="font-bold">{m.adminCountry()}</TableHead>
              <TableHead class="text-right font-bold">{m.adminCongregationCount()}</TableHead>
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
      {:else}
        <div class="space-y-2">
          {#each new Array(5) as _}
            <Skeleton class="h-8 w-full" />
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
