<script lang="ts">
  import { page } from '$app/state';
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNextButton, PaginationPrevButton } from '$lib/components/ui/pagination';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Search from '@lucide/svelte/icons/search';
  import Download from '@lucide/svelte/icons/download';
  import { goto } from '$app/navigation';

  let { data } = $props();

  type User = (typeof data.users)[number];

  let search = $state('');
  let adminFilter = $state('');
  let currentPage = $state(data.page);

  const columnHelper = createColumnHelper<User>();

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue() || '—',
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue() || '—',
    }),
    columnHelper.accessor('verified', {
      header: 'Verified',
      cell: (info) =>
        info.getValue()
          ? '<Badge variant="default">Yes</Badge>'
          : '<Badge variant="secondary">No</Badge>',
    }),
    columnHelper.accessor('admin', {
      header: 'Admin',
      cell: (info) =>
        info.getValue()
          ? '<Badge variant="destructive">Admin</Badge>'
          : '—',
    }),
    columnHelper.accessor('lang', {
      header: 'Lang',
      cell: (info) => info.getValue() || 'en',
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
    data: data.users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function doSearch() {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (adminFilter) params.set('admin', adminFilter);
    params.set('page', '1');
    goto(`/admin/users?${params}`);
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Users</h1>
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-foreground">{data.total} total</span>
      <a href="/admin/users/export">
        <Button variant="outline" size="sm">
          <Download class="mr-1 size-4" /> Export CSV
        </Button>
      </a>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <div class="relative flex-1">
      <Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input
        bind:value={search}
        placeholder="Search users by name or email..."
        class="pl-8"
        onkeydown={(e) => { if (e.key === 'Enter') doSearch(); }}
      />
    </div>
    <select
      class="border-input flex h-11 w-[140px] items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs"
      bind:value={adminFilter}
      onchange={() => doSearch()}
    >
      <option value="">All</option>
      <option value="true">Admins</option>
      <option value="false">Users</option>
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
            <TableHead class="w-[80px]">Actions</TableHead>
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
              <Button
                variant="ghost"
                size="icon-sm"
                onclick={() => goto(`/admin/users/${row.original.id}`)}
              >
                <Pencil class="size-4" />
                <span class="sr-only">Edit</span>
              </Button>
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
            <PaginationLink href={`/admin/users?page=${p}`} isActive={p === currentPage}>{p}</PaginationLink>
          </PaginationItem>
        {/each}
        <PaginationNextButton />
      </PaginationContent>
    </Pagination>
  {/if}
</div>
