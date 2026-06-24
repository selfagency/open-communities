<script lang="ts">
  import Fuzzy from '@leeoniya/ufuzzy';
  import CheckIcon from '@tabler/icons-svelte/icons/check';
  import XIcon from '@tabler/icons-svelte/icons/x';
  import PencilIcon from '@tabler/icons-svelte/icons/pencil';
  import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
  import { createRawSnippet } from 'svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { FlexRender, createSvelteTable, renderSnippet } from '$lib/components/ui/data-table/index.js';
  import { Input } from '$lib/components/ui/input';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';

  interface Cong { id: string; name: string; denomination: string; visible: boolean; city: string; state: string; countryCode: string; owner: string; created: string; }

  let { data }: { data: { congregations: Cong[]; active: Cong[]; pending: Cong[] } } = $props();
  let search = $state('');

  const allCongs = $derived(data.congregations);
  const searchStrings = $derived(allCongs.map((c) => `${c.name} ${c.denomination ?? ''} ${c.city ?? ''} ${c.state ?? ''}`));
  const fuzzy = new Fuzzy();
  const filtered = $derived(search ? fuzzy.filter(searchStrings, search.toLowerCase())?.map(i => allCongs[i]) ?? allCongs : allCongs);

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

  const nameCell = (v: string) => renderSnippet(createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="font-medium">${get().v}</span>` })), { v });
  const denomCell = (v: string) => renderSnippet(createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="capitalize">${get().v || '—'}</span>` })), { v });
  const mutedCell = (v: string) => renderSnippet(createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="text-muted-foreground text-xs">${get().v || '—'}</span>` })), { v });

  const activeCols: ColumnDef<Cong>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => nameCell(row.original.name) },
    { accessorKey: 'denomination', header: 'Denomination', cell: ({ row }) => denomCell(row.original.denomination) },
    { id: 'location', header: 'Location', cell: ({ row }) => renderSnippet(createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="text-muted-foreground">${get().v}</span>` })), { v: locationStr(row.original) }) },
    { accessorKey: 'owner', header: 'Owner', cell: ({ row }) => mutedCell(row.original.owner) },
  ];

  const pendingCols: ColumnDef<Cong>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => nameCell(row.original.name) },
    { accessorKey: 'denomination', header: 'Denomination', cell: ({ row }) => denomCell(row.original.denomination) },
    { accessorKey: 'owner', header: 'Submitted By', cell: ({ row }) => mutedCell(row.original.owner) },
    { accessorKey: 'created', header: 'Date', cell: ({ row }) => mutedCell((row.original.created || '').slice(0, 10)) },
  ];

  const activeTable = $derived(createSvelteTable({ get data() { return filtered.filter((c) => c.visible); }, columns: activeCols, getRowId: (r) => r.id, getCoreRowModel: getCoreRowModel() }));
  const pendingTable = $derived(createSvelteTable({ get data() { return data.pending; }, columns: pendingCols, getRowId: (r) => r.id, getCoreRowModel: getCoreRowModel() }));
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
            {#each activeTable.getHeaderGroups() as hg (hg.id)}
              <TableRow>
                {#each hg.headers as h (h.id)}
                  <TableHead>
                    {#if !h.isPlaceholder}
                      <FlexRender content={h.column.columnDef.header} context={h.getContext()} />
                    {/if}
                  </TableHead>
                {/each}
                <TableHead class="w-16"></TableHead>
              </TableRow>
            {/each}
          </TableHeader>
          <TableBody>
            {#each activeTable.getRowModel().rows as row (row.id)}
              <TableRow>
                {#each row.getVisibleCells() as cell (cell.id)}
                  <TableCell>
                    <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                  </TableCell>
                {/each}
                <TableCell>
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
                </TableCell>
              </TableRow>
            {:else}
              <TableRow><TableCell colspan={activeCols.length + 1} class="h-24 text-center">No approved congregations</TableCell></TableRow>
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
              {#each pendingTable.getHeaderGroups() as hg (hg.id)}
                <TableRow>
                  {#each hg.headers as h (h.id)}
                    <TableHead>
                      {#if !h.isPlaceholder}
                        <FlexRender content={h.column.columnDef.header} context={h.getContext()} />
                      {/if}
                    </TableHead>
                  {/each}
                  <TableHead class="w-24"></TableHead>
                </TableRow>
              {/each}
            </TableHeader>
            <TableBody>
              {#each pendingTable.getRowModel().rows as row (row.id)}
                <TableRow>
                  {#each row.getVisibleCells() as cell (cell.id)}
                    <TableCell>
                      <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
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
                <TableRow><TableCell colspan={pendingCols.length + 1} class="h-24 text-center">No pending congregations</TableCell></TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
