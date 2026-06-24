<script lang="ts">
  import { page } from '$app/state';
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNextButton, PaginationPrevButton } from '$lib/components/ui/pagination';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core';
  import Building2 from '@lucide/svelte/icons/building-2';
  import Eye from '@lucide/svelte/icons/eye';
  import EyeOff from '@lucide/svelte/icons/eye-off';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Search from '@lucide/svelte/icons/search';
  import { goto } from '$app/navigation';

  let { data } = $props();

  type Congregation = (typeof data.congregations)[number];
  type LocationValue = { city?: { name?: string }; state?: { name?: string } };

  let search = $state('');
  let statusFilter = $state('all');
  let currentPage = $state(data.page);

  const columnHelper = createColumnHelper<Congregation>();

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue() || '—',
    }),
    columnHelper.accessor('location', {
      header: 'Location',
      cell: (info) => {
        const loc = info.getValue() as LocationValue | null;
        if (!loc) return '—';
        const parts: string[] = [];
        if (loc.city?.name) parts.push(loc.city.name);
        if (loc.state?.name) parts.push(loc.state.name);
        return parts.join(', ') || '—';
      },
    }),
    columnHelper.accessor('denomination', {
      header: 'Denomination',
      cell: (info) => info.getValue() || '—',
    }),
    columnHelper.accessor('visible', {
      header: 'Status',
      cell: (info) => {
        const visible = info.getValue();
        return visible
          ? '<Badge variant="default">Visible</Badge>'
          : '<Badge variant="secondary">Hidden</Badge>';
      },
    }),
    columnHelper.accessor('created', {
      header: 'Created',
      cell: (info) => {
        const d = info.getValue();
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    }),
  ];

  const table = createSvelteTable({
    data: data.congregations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function doSearch() {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    params.set('page', '1');
    goto(`/admin/congregations?${params}`);
  }

  async function toggleVisibility(id: string) {
    await fetch(`/admin/congregations/${id}/toggle`, { method: 'POST' });
    window.location.reload();
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Congregations</h1>
    <span class="text-sm text-muted-foreground">{data.total} total</span>
  </div>

  <div class="flex items-center gap-2">
    <div class="relative flex-1">
      <Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input
        bind:value={search}
        placeholder="Search congregations..."
        class="pl-8"
        onkeydown={(e) => { if (e.key === 'Enter') doSearch(); }}
      />
    </div>
    <select
      class="border-input flex h-11 w-[140px] items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs"
      bind:value={statusFilter}
      onchange={() => doSearch()}
    >
      <option value="all">All</option>
      <option value="visible">Visible</option>
      <option value="hidden">Hidden</option>
    </select>
    <Button onclick={doSearch} variant="secondary">Search</Button>
  </div>

  <div class="rounded-md border">
    <Table>
      <TableHeader>
        {#each table.getHeaderGroups() as headerGroup}
          <TableRow>
            {#each headerGroup.headers as header}
              <TableHead>
                <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
              </TableHead>
            {/each}
            <TableHead class="w-[100px]">Actions</TableHead>
          </TableRow>
        {/each}
      </TableHeader>
      <TableBody>
        {#each table.getRowModel().rows as row}
          <TableRow>
            {#each row.getVisibleCells() as cell}
              <TableCell>
                <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
              </TableCell>
            {/each}
            <TableCell>
              <div class="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onclick={() => goto(`/admin/congregations/${row.original.id}/edit`)}
                >
                  <Pencil class="size-4" />
                  <span class="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onclick={() => toggleVisibility(row.original.id)}
                >
                  {#if row.original.visible}
                    <EyeOff class="size-4" />
                  {:else}
                    <Eye class="size-4" />
                  {/if}
                  <span class="sr-only">Toggle visibility</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </div>

  {#if data.total > data.perPage}
    <Pagination count={Math.ceil(data.total / data.perPage)} bind:page={currentPage} perPage={data.perPage}>
      <PaginationContent>
        <PaginationPrevButton />
        {#each Array.from({ length: Math.min(5, Math.ceil(data.total / data.perPage)) }, (_, i) => i + 1) as p}
          <PaginationItem>
            <PaginationLink href={`/admin/congregations?page=${p}`} isActive={p === currentPage}>{p}</PaginationLink>
          </PaginationItem>
        {/each}
        <PaginationNextButton />
      </PaginationContent>
    </Pagination>
  {/if}
</div>
