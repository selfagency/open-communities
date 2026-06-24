<script lang="ts">
  import Fuzzy from '@leeoniya/ufuzzy';
  import PencilIcon from '@tabler/icons-svelte/icons/pencil';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';

  let { data } = $props();
  let search = $state('');

  // Pre-build fuzzy search strings
  const searchStrings = $derived(data.congregations.map(
    (c: any) => `${c.name} ${c.denomination ?? ''} ${c.city ?? ''} ${c.state ?? ''}`
  ));

  const fuzzy = new Fuzzy();

  const filtered = $derived(
    search
      ? fuzzy.filter(searchStrings, search.toLowerCase())?.map(i => data.congregations[i]) ?? data.congregations
      : data.congregations
  );

  function editUrl(id: string) { return '/edit?id=' + id; }

  async function approve(id: string) {
    await fetch('/api/admin/congregations/' + id + '/toggle', { method: 'POST' });
    window.location.reload();
  }

  async function reject(id: string) {
    await fetch('/api/admin/congregations/' + id + '/delete', { method: 'DELETE' });
    window.location.reload();
  }
</script>

<div class="space-y-8">
  <div class="flex items-center gap-2">
    <Input
      bind:value={search}
      placeholder="Search by name, denomination, location..."
      class="h-9 max-w-sm"
    />
    {#if search}
      <p class="text-muted-foreground text-sm">{filtered.length} results</p>
    {/if}
  </div>

  <!-- Active congregations -->
  <div>
    <h2 class="mb-4 text-lg font-semibold">Congregations</h2>
    <p class="text-muted-foreground -mt-3 mb-4 text-sm">{data.active.length} approved</p>
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
            {#each filtered.filter(c => c.visible) as cong}
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
                <TableCell colspan="5" class="text-muted-foreground py-8 text-center">No approved congregations</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
                <TableHead class="w-24"></TableHead>
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger aschild>
                            <Button variant="default" size="icon" class="size-8" onclick={() => approve(cong.id)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M20 6L9 17l-5-5"/></svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Approve</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger aschild>
                            <Button variant="destructive" size="icon" class="size-8" onclick={() => reject(cong.id)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reject</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
