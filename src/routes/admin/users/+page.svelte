<script lang="ts">
  import { page } from '$app/state';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  let { data } = $props();
  let search = $state(data.search);

  function doSearch() {
    const params = new URLSearchParams(page.url.searchParams);
    if (search) params.set('q', search); else params.delete('q');
    params.set('page', '1');
    goto();
  }

  function goto() {
    const params = new URLSearchParams(page.url.searchParams);
    window.location.href = `/admin/users?${params}`;
  }

  function prevPage() {
    if (data.page <= 1) return;
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', String(data.page - 1));
    window.location.href = `/admin/users?${params}`;
  }

  function nextPage() {
    if (data.page * data.perPage >= data.total) return;
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', String(data.page + 1));
    window.location.href = `/admin/users?${params}`;
  }
</script>

<div class="px-4 lg:px-6">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold">Users</h1>
      <p class="text-muted-foreground text-sm">{data.total} total</p>
    </div>
    <div class="flex items-center gap-2">
      <Input bind:value={search} placeholder="Search users..." class="h-9 w-64"
        onkeydown={(e) => { if (e.key === 'Enter') doSearch(); }} />
      <Button variant="outline" onclick={doSearch}>Search</Button>
      <Button variant="outline" onclick={() => window.location.href = '/admin/users/export'}>Export CSV</Button>
    </div>
  </div>

  <Card>
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each data.users as u}
            <TableRow>
              <TableCell class="font-medium">{u.name || '—'}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell class="uppercase text-xs">{u.lang ?? 'en'}</TableCell>
              <TableCell>
                {#if u.verified}
                  <Badge variant="default" class="text-xs">Verified</Badge>
                {:else}
                  <Badge variant="secondary" class="text-xs">Unverified</Badge>
                {/if}
              </TableCell>
              <TableCell>
                {#if u.admin}
                  <Badge variant="default" class="bg-amber-500 text-xs hover:bg-amber-500">Admin</Badge>
                {:else}
                  <span class="text-muted-foreground text-xs">User</span>
                {/if}
              </TableCell>
              <TableCell class="text-muted-foreground text-xs">{String(u.created ?? '').slice(0, 10)}</TableCell>
            </TableRow>
          {:else}
            <TableRow>
              <TableCell colspan="6" class="text-muted-foreground py-8 text-center">No users found</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  <div class="mt-4 flex items-center justify-between">
    <p class="text-muted-foreground text-sm">Page {data.page} of {Math.ceil(data.total / data.perPage) || 1}</p>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" disabled={data.page <= 1} onclick={prevPage}>Previous</Button>
      <Button variant="outline" size="sm" disabled={data.page * data.perPage >= data.total} onclick={nextPage}>Next</Button>
    </div>
  </div>
</div>
