<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  let { data } = $props();
  let search = $state(data.search);

  function doSearch() {
    const params = new URLSearchParams(page.url.searchParams);
    if (search) params.set('q', search);
    else params.delete('q');
    params.set('page', '1');
    goto(`/admin/congregations?${params}`);
  }

  function setStatus(s: string) {
    const params = new URLSearchParams(page.url.searchParams);
    params.set('status', s);
    params.set('page', '1');
    goto(`/admin/congregations?${params}`);
  }

  function goto(url: string) {
    window.location.href = url;
  }

  function prevPage() {
    if (data.page <= 1) return;
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', String(data.page - 1));
    goto(`/admin/congregations?${params}`);
  }

  function nextPage() {
    if (data.page * data.perPage >= data.total) return;
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', String(data.page + 1));
    goto(`/admin/congregations?${params}`);
  }
</script>

<div class="px-4 lg:px-6">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold">Congregations</h1>
      <p class="text-muted-foreground text-sm">{data.total} total ({data.pendingApprovals} pending approval)</p>
    </div>
    <div class="flex items-center gap-2">
      <Input
        bind:value={search}
        placeholder="Search congregations..."
        class="h-9 w-64"
        onkeydown={(e) => { if (e.key === 'Enter') doSearch(); }}
      />
      <Button variant="outline" onclick={doSearch}>Search</Button>
    </div>
  </div>

  <!-- Status filter tabs -->
  <div class="mb-4 flex gap-1">
    {#each ['all', 'visible', 'hidden'] as s}
      <Button
        variant={data.status === s ? 'default' : 'ghost'}
        size="sm"
        onclick={() => setStatus(s)}
      >
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </Button>
    {/each}
  </div>

  <Card>
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Denomination</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each data.congregations as cong}
            <TableRow>
              <TableCell class="font-medium">{cong.name}</TableCell>
              <TableCell class="capitalize">{cong.denomination ?? '—'}</TableCell>
              <TableCell class="text-muted-foreground">{cong.city ?? ''}{cong.state ? `, ${cong.state}` : ''}</TableCell>
              <TableCell>
                {#if cong.visible}
                  <span class="text-green-600 text-xs font-medium">Visible</span>
                {:else}
                  <span class="text-amber-600 text-xs font-medium">Hidden</span>
                {/if}
              </TableCell>
              <TableCell class="text-muted-foreground text-xs">{cong.owner || '—'}</TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="sm" onclick={() => goto(`/edit?id=${cong.id}`)}>Edit</Button>
              </TableCell>
            </TableRow>
          {:else}
            <TableRow>
              <TableCell colspan="6" class="text-muted-foreground py-8 text-center">
                No congregations found
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  <!-- Pagination -->
  <div class="mt-4 flex items-center justify-between">
    <p class="text-muted-foreground text-sm">
      Page {data.page} of {Math.ceil(data.total / data.perPage) || 1}
    </p>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" disabled={data.page <= 1} onclick={prevPage}>Previous</Button>
      <Button variant="outline" size="sm" disabled={data.page * data.perPage >= data.total} onclick={nextPage}>Next</Button>
    </div>
  </div>
</div>
