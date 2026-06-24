<script lang="ts">
  import PencilIcon from '@tabler/icons-svelte/icons/pencil';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';

  let { data } = $props();
  let search = $state(data.search);

  function doSearch() {
    const params = new URLSearchParams(window.location.search);
    if (search) params.set('q', search); else params.delete('q');
    params.set('page', '1');
    window.location.href = `/admin/congregations?${params}`;
  }

  function prevPage() {
    if (data.page <= 1) return;
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(data.page - 1));
    window.location.href = `/admin/congregations?${params}`;
  }

  function nextPage() {
    if (data.page * data.perPage >= data.total) return;
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(data.page + 1));
    window.location.href = `/admin/congregations?${params}`;
  }

  function editUrl(id: string) {
    return `/edit?id=${id}`;
  }
</script>

<div class="space-y-8">
  <!-- Search -->
  <div class="flex items-center gap-2">
    <Input
      bind:value={search}
      placeholder="Search congregations..."
      class="h-9 max-w-sm"
      onkeydown={(e) => { if (e.key === 'Enter') doSearch(); }}
    />
    <Button variant="outline" onclick={doSearch}>Search</Button>
  </div>

  <!-- Active congregations -->
  <div>
    <h2 class="mb-4 text-lg font-semibold">Congregations</h2>
    <p class="text-muted-foreground -mt-3 mb-4 text-sm">{data.total} approved</p>
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Denomination</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead class="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each data.active as cong}
              <TableRow>
                <TableCell class="font-medium">{cong.name}</TableCell>
                <TableCell class="capitalize">{cong.denomination ?? '—'}</TableCell>
                <TableCell class="text-muted-foreground">{cong.city ?? ''}{cong.state ? `, ${cong.state}` : ''}</TableCell>
                <TableCell class="text-muted-foreground text-xs">{cong.owner || '—'}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger aschild>
                        <Button variant="ghost" size="icon" onclick={() => window.location.href = editUrl(cong.id)}>
                          <PencilIcon class="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit congregation</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            {:else}
              <TableRow>
                <TableCell colspan="5" class="text-muted-foreground py-8 text-center">No congregations found</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Pagination -->
    <div class="mt-4 flex items-center justify-between">
      <p class="text-muted-foreground text-sm">Page {data.page} of {Math.ceil(data.total / data.perPage) || 1}</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" disabled={data.page <= 1} onclick={prevPage}>Previous</Button>
        <Button variant="outline" size="sm" disabled={data.page * data.perPage >= data.total} onclick={nextPage}>Next</Button>
      </div>
    </div>
  </div>

  <!-- Pending approvals -->
  {#if data.pending.length > 0}
    <div>
      <h2 class="mb-4 text-lg font-semibold">Approvals</h2>
      <p class="text-muted-foreground -mt-3 mb-4 text-sm">{data.pending.length} pending approval</p>
      <Card>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Denomination</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead class="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each data.pending as cong}
                <TableRow>
                  <TableCell class="font-medium">{cong.name}</TableCell>
                  <TableCell class="capitalize">{cong.denomination ?? '—'}</TableCell>
                  <TableCell class="text-muted-foreground text-xs">{cong.owner || '—'}</TableCell>
                  <TableCell class="text-muted-foreground text-xs">{String(cong.created ?? '').slice(0, 10)}</TableCell>
                  <TableCell>
                    <div class="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger aschild>
                            <Button variant="ghost" size="icon" onclick={() => window.location.href = editUrl(cong.id)}>
                              <PencilIcon class="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit congregation</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="default" size="icon" class="size-8" onclick={async () => { await fetch(`/api/admin/congregations/${cong.id}/toggle`, { method: 'POST' }); window.location.reload(); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M20 6L9 17l-5-5"/></svg>
                      </Button>
                      <Button variant="destructive" size="icon" class="size-8" onclick={async () => { await fetch(`/api/admin/congregations/${cong.id}/delete`, { method: 'DELETE' }); window.location.reload(); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
