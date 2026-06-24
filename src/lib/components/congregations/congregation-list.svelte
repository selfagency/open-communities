<script lang="ts">
  import Fuzzy from '@leeoniya/ufuzzy';
  import CheckIcon from '@tabler/icons-svelte/icons/check';
  import XIcon from '@tabler/icons-svelte/icons/x';
  import PencilIcon from '@tabler/icons-svelte/icons/pencil';
  import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { FlexRender, createSvelteTable } from '$lib/components/ui/data-table/index.js';
  import { Input } from '$lib/components/ui/input';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';

  interface Cong {
    id: string; name: string; denomination: string; visible: boolean;
    city: string; state: string; countryCode: string;
    owner: string; created: string;
  }

  let { data }: { data: { congregations: Cong[]; active: Cong[]; pending: Cong[] } } = $props();
  let search = $state('');

  const allCongs = $derived(data.congregations);
  const searchStrings = $derived(allCongs.map((c) => `${c.name} ${c.denomination ?? ''} ${c.city ?? ''} ${c.state ?? ''}`));
  const fuzzy = new Fuzzy();
  const filtered = $derived(
    search ? fuzzy.filter(searchStrings, search.toLowerCase())?.map(i => allCongs[i]) ?? allCongs : allCongs
  );

  let pendingId = $state<string | null>(null);
  let pendingAction = $state<'approve' | 'reject' | null>(null);

  function editUrl(id: string) { return '/edit?id=' + id; }
  async function confirmAction() {
    if (!pendingId || !pendingAction) return;
    await fetch('/api/admin/congregations/' + pendingId + (pendingAction === 'approve' ? '/toggle' : '/delete'), { method: pendingAction === 'approve' ? 'POST' : 'DELETE' });
    pendingId = null; pendingAction = null;
    window.location.reload();
  }

  function locationStr(c: Cong) {
    let s = c.city || '';
    if (c.state) s += (s ? ', ' : '') + c.state;
    if (c.countryCode && c.countryCode !== 'US') s += ' (' + c.countryCode + ')';
    return s || '—';
  }

  const colHelper = createColumnHelper<Cong>();

  const nameCol = colHelper.accessor('name', { header: 'Name', cell: ({ getValue }) => getValue() });
  const denomCol = colHelper.accessor('denomination', { header: 'Denomination', cell: ({ getValue }) => getValue() || '—' });
  const locationCol = colHelper.accessor((r) => locationStr(r), { id: 'location', header: 'Location' });
  const ownerCol = colHelper.accessor('owner', { header: 'Owner' });
  const dateCol = colHelper.accessor('created', { header: 'Date', cell: ({ getValue }) => (getValue() || '').slice(0, 10) });
  const editCol = colHelper.display({
    id: 'edit', header: '',
    cell: ({ row }) => row.original.id,
  });

  const actionCol = colHelper.display({
    id: 'actions', header: '',
    cell: ({ row }) => row.original.id,
  });

  const activeCols = [nameCol, denomCol, locationCol, ownerCol, editCol];
  const pendingCols = [nameCol, denomCol, dateCol, actionCol];

  const activeTable = $derived(createSvelteTable({
    data: filtered.filter((c) => c.visible),
    columns: activeCols,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
  }));

  const pendingTable = $derived(createSvelteTable({
    data: data.pending,
    columns: pendingCols,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
  }));
</script>

<div class="space-y-8">
  <div class="flex items-center gap-2">
    <Input bind:value={search} placeholder="Search by name, denomination, location..." class="h-9 max-w-sm" />
    {#if search}<p class="text-muted-foreground text-sm">{filtered.filter(c => c.visible).length} results</p>{/if}
  </div>

  <div>
    <h2 class="mb-4 text-lg font-semibold">Congregations</h2>
    <p class="text-muted-foreground -mt-3 mb-4 text-sm">{data.active.length} approved</p>
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            {#each activeTable.getHeaderGroups() as hg}
              <TableRow>
                {#each hg.headers as h}
                  <TableHead class={h.id === 'edit' ? 'w-16' : ''}>
                    <FlexRender content={h.column.columnDef.header} context={h.getContext()} />
                  </TableHead>
                {/each}
              </TableRow>
            {/each}
          </TableHeader>
          <TableBody>
            {#each activeTable.getRowModel().rows as row}
              <TableRow>
                {#each row.getVisibleCells() as cell}
                  {#if cell.column.id === 'edit'}
                    <TableCell class="w-16">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="ghost" size="icon" onclick={() => window.location.href = '/edit?id=' + (cell.getValue() as string)}>
                              <PencilIcon class="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit congregation</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  {:else if cell.column.id === 'name'}
                    <TableCell class="font-medium">{cell.getValue() as string}</TableCell>
                  {:else if cell.column.id === 'denomination'}
                    <TableCell class="capitalize">{(cell.getValue() as string) || '—'}</TableCell>
                  {:else if cell.column.id === 'owner'}
                    <TableCell class="text-muted-foreground text-xs">{(cell.getValue() as string) || '—'}</TableCell>
                  {:else}
                    <TableCell class="text-muted-foreground">{cell.getValue() as string}</TableCell>
                  {/if}
                {/each}
              </TableRow>
            {:else}
              <TableRow><TableCell colspan={5} class="text-muted-foreground py-8 text-center">No approved congregations</TableCell></TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>

  {#if data.pending.length > 0}
    <div>
      <h2 class="mb-4 text-lg font-semibold">Approvals</h2>
      <p class="text-muted-foreground -mt-3 mb-4 text-sm">{data.pending.length} pending approval</p>
      <Card>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              {#each pendingTable.getHeaderGroups() as hg}
                <TableRow>
                  {#each hg.headers as h}
                    <TableHead>{h.column.columnDef.header as string}</TableHead>
                  {/each}
                  <TableHead class="w-24"></TableHead>
                </TableRow>
              {/each}
            </TableHeader>
            <TableBody>
              {#each pendingTable.getRowModel().rows as row}
                <TableRow>
                  {#each row.getVisibleCells() as cell}
                    <TableCell class={cell.column.id === 'edit' ? '' : cell.column.id === 'name' ? 'font-medium' : cell.column.id === 'owner' || cell.column.id === 'date' ? 'text-muted-foreground text-xs' : ''}>
                      {cell.getValue() as string}
                    </TableCell>
                  {/each}
                  <TableCell>
                    <div class="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="ghost" size="icon" onclick={() => window.location.href = editUrl(row.original.id)}>
                              <PencilIcon class="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit congregation</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger>
                          <Button variant="default" size="icon" class="size-8" onclick={() => { pendingId = row.original.id; pendingAction = 'approve'; }}>
                            <CheckIcon class="size-4" />
                          </Button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content>
                          <AlertDialog.Header>
                            <AlertDialog.Title>Approve Congregation</AlertDialog.Title>
                            <AlertDialog.Description>Approve "{row.original.name}" and make it visible?</AlertDialog.Description>
                          </AlertDialog.Header>
                          <AlertDialog.Footer>
                            <AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
                            <Button variant="default" onclick={confirmAction}>Approve</Button>
                          </AlertDialog.Footer>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger>
                          <Button variant="destructive" size="icon" class="size-8" onclick={() => { pendingId = row.original.id; pendingAction = 'reject'; }}>
                            <XIcon class="size-4" />
                          </Button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content>
                          <AlertDialog.Header>
                            <AlertDialog.Title>Reject Congregation</AlertDialog.Title>
                            <AlertDialog.Description>Reject "{row.original.name}"? This will delete it permanently.</AlertDialog.Description>
                          </AlertDialog.Header>
                          <AlertDialog.Footer>
                            <AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
                            <Button variant="destructive" onclick={confirmAction}>Reject</Button>
                          </AlertDialog.Footer>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                    </div>
                  </TableCell>
                </TableRow>
              {:else}
                <TableRow><TableCell colspan={5} class="text-muted-foreground py-8 text-center">No pending congregations</TableCell></TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
