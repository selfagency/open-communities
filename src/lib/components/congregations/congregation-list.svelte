<script lang="ts">
  import Fuzzy from '@leeoniya/ufuzzy';
  import CheckIcon from '@tabler/icons-svelte/icons/check';
  import PencilIcon from '@tabler/icons-svelte/icons/pencil';
  import SearchIcon from '@tabler/icons-svelte/icons/search';
  import XIcon from '@tabler/icons-svelte/icons/x';
  import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
  import { createRawSnippet } from 'svelte';
  import { goto } from '$app/navigation';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { createSvelteTable, FlexRender, renderSnippet } from '$lib/components/ui/data-table/index.js';
  import { Input } from '$lib/components/ui/input';
  import * as Pagination from '$lib/components/ui/pagination';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';
  import { m } from '$lib/paraglide/messages';

  interface Cong { id: string; name: string; denomination: string; visible: boolean; city: string; state: string; countryCode: string; owner: string; ownerId: string; created: string; }

  let { data }: { data: { congregations: Cong[]; active: Cong[]; pending: Cong[] } } = $props();
  let search = $state('');

  const allCongs = $derived(data.congregations);
  const searchStrings = $derived(allCongs.map((c) => `${c.name} ${c.denomination ?? ''} ${c.city ?? ''} ${c.state ?? ''}`));
  const fuzzy = new Fuzzy();
  const filtered = $derived(search ? fuzzy.filter(searchStrings, search.toLowerCase())?.map(i => allCongs[i]) ?? allCongs : allCongs);

  const PER_PAGE = 18;
  let currentPage = $state(1);
  const activeFiltered = $derived(filtered.filter((c) => c.visible));
  const totalPages = $derived(Math.ceil(activeFiltered.length / PER_PAGE) || 1);
  const paginatedActive = $derived(activeFiltered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE));

  function onPageChange(p: number) {
    currentPage = p;
  }

  // Reset to page 1 when search changes
  $effect(() => { filtered.length; currentPage = 1; });

  let pendingId = $state<string | null>(null);
  let pendingAction = $state<'approve' | 'reject' | null>(null);

  function editUrl(id: string) { return '/edit?id=' + id; }
  async function confirmAction() {
    if (!pendingId || !pendingAction) return;
    await fetch('/api/admin/congregations/' + pendingId + (pendingAction === 'approve' ? '/toggle' : '/delete'), { method: pendingAction === 'approve' ? 'POST' : 'DELETE' });
    pendingId = null; pendingAction = null;
    goto('/admin/congregations');
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
  const ownerCell = (email: string, id: string) =>
    id
      ? renderSnippet(createRawSnippet<[{ e: string; i: string }]>((get) => ({ render: () => `<a href="/admin/users/${get().i}" class="text-muted-foreground text-xs underline-offset-4 hover:underline">${get().e}</a>` })), { e: email, i: id })
      : mutedCell(email);

  const activeCols: ColumnDef<Cong>[] = [
    { accessorKey: 'name', header: m.name(), cell: ({ row }) => nameCell(row.original.name) },
    { accessorKey: 'denomination', header: m.denomination(), cell: ({ row }) => denomCell(row.original.denomination) },
    { id: 'location', header: m.location(), cell: ({ row }) => renderSnippet(createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="text-muted-foreground">${get().v}</span>` })), { v: locationStr(row.original) }) },
    { accessorKey: 'owner', header: m.owner(), cell: ({ row }) => ownerCell(row.original.owner, row.original.ownerId) },
  ];

  const pendingCols: ColumnDef<Cong>[] = [
    { accessorKey: 'name', header: m.name(), cell: ({ row }) => nameCell(row.original.name) },
    { accessorKey: 'denomination', header: m.denomination(), cell: ({ row }) => denomCell(row.original.denomination) },
    { accessorKey: 'owner', header: m.submittedBy(), cell: ({ row }) => mutedCell(row.original.owner) },
    { accessorKey: 'created', header: m.date(), cell: ({ row }) => mutedCell((row.original.created || '').slice(0, 10)) },
  ];

  const activeTable = $derived(createSvelteTable({ get data() { return paginatedActive; }, columns: activeCols, getRowId: (r) => r.id, getCoreRowModel: getCoreRowModel() }));
  const pendingTable = $derived(createSvelteTable({ get data() { return data.pending; }, columns: pendingCols, getRowId: (r) => r.id, getCoreRowModel: getCoreRowModel() }));
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-2xl font-semibold">{m.adminCongregations()}</h2>
    </div>
    <div class="flex items-center gap-2">
      <div class="relative shadow-xs">
        <SearchIcon size="18" class="absolute left-3 z-10 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        <Input bind:value={search} placeholder={m.searchCongregations()} class="h-11 w-64 sm:w-80 pl-10" />
      </div>
      {#if search}<p class="text-muted-foreground text-sm">{m.searchResults({ count: filtered.filter(c => c.visible).length })}</p>{/if}
    </div>
  </div>
  <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            {#each activeTable.getHeaderGroups() as hg (hg.id)}
              <TableRow>
                {#each hg.headers as h (h.id)}
                  <TableHead class="font-bold">
                    {#if !h.isPlaceholder}
                      <FlexRender content={h.column.columnDef.header} context={h.getContext()} />
                    {/if}
                  </TableHead>
                {/each}
                <TableHead class="w-16 font-bold"></TableHead>
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
                        <Button variant="ghost" size="icon" onclick={() => goto(editUrl(row.original.id))}>
                          <PencilIcon class="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{m.editCongregation()}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            {:else}
              <TableRow><TableCell colspan={activeCols.length + 1} class="h-24 text-center">{m.noApprovedCongregations()}</TableCell></TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <div class="flex w-full scale-90 flex-row items-center justify-center pt-2 sm:scale-100">
      <Pagination.Root count={activeFiltered.length} perPage={PER_PAGE} page={currentPage} onPageChange={onPageChange} siblingCount={0}>
        {#snippet children({ pages })}
          <Pagination.Content>
            <Pagination.Item><Pagination.PrevButton /></Pagination.Item>
            {#each pages as page (page.key)}
              {#if page.type === "ellipsis"}
                <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
              {:else}
                <Pagination.Item><Pagination.Link {page} isActive={currentPage == page.value}>{page.value}</Pagination.Link></Pagination.Item>
              {/if}
            {/each}
            <Pagination.Item><Pagination.NextButton /></Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
    </div>

  {#if data.pending.length > 0}
    <div>
      <h2 class="mb-4 text-lg font-semibold">{m.approvals()}</h2>
      <p class="text-muted-foreground -mt-3 mb-4 text-sm">{data.pending.length} {m.pending()}</p>
      <Card>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              {#each pendingTable.getHeaderGroups() as hg (hg.id)}
                <TableRow>
                  {#each hg.headers as h (h.id)}
                    <TableHead class="font-bold">
                      {#if !h.isPlaceholder}
                        <FlexRender content={h.column.columnDef.header} context={h.getContext()} />
                      {/if}
                    </TableHead>
                  {/each}
                  <TableHead class="w-24 font-bold"></TableHead>
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
                            <Button variant="ghost" size="icon" onclick={() => goto(editUrl(row.original.id))}>
                              <PencilIcon class="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{m.editCongregation()}</TooltipContent>
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
                            <AlertDialog.Title>{m.approveCongregation()}</AlertDialog.Title>
                            <AlertDialog.Description>{m.approveConfirmation({ name: row.original.name })}</AlertDialog.Description>
                          </AlertDialog.Header>
                          <AlertDialog.Footer>
                            <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
                            <Button variant="default" onclick={confirmAction}>{m.approve()}</Button>
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
                            <AlertDialog.Title>{m.rejectCongregation()}</AlertDialog.Title>
                            <AlertDialog.Description>{m.rejectConfirmation({ name: row.original.name })}</AlertDialog.Description>
                          </AlertDialog.Header>
                          <AlertDialog.Footer>
                            <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
                            <Button variant="destructive" onclick={confirmAction}>{m.reject()}</Button>
                          </AlertDialog.Footer>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                    </div>
                  </TableCell>
                </TableRow>
              {:else}
                <TableRow><TableCell colspan={pendingCols.length + 1} class="h-24 text-center">{m.noResults()}</TableCell></TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
