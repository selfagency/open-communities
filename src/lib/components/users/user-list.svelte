<script lang="ts">
  import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
  import { createRawSnippet } from 'svelte';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { createSvelteTable, FlexRender, renderSnippet } from '$lib/components/ui/data-table/index.js';
  import { Input } from '$lib/components/ui/input';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  interface User { id: string; name: string; email: string; lang: string; verified: boolean; admin: boolean; created: string; }

  let { data }: { data: { users: User[]; total: number; page: number; perPage: number; search: string } } = $props();
  let search = $state(data.search);

  function doSearch() {
    const params = new URLSearchParams(page.url.searchParams);
    if (search) params.set('q', search); else params.delete('q');
    params.set('page', '1');
    window.location.href = '/admin/users?' + params;
  }
  function prevPage() {
    if (data.page <= 1) return;
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', String(data.page - 1));
    window.location.href = '/admin/users?' + params;
  }
  function nextPage() {
    if (data.page * data.perPage >= data.total) return;
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', String(data.page + 1));
    window.location.href = '/admin/users?' + params;
  }

  function s(content: string): string {
    return content;
  }

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => s(row.original.name || '—') },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => s(row.original.email) },
    { accessorKey: 'lang', header: 'Language', cell: ({ row }) => s((row.original.lang || 'en').toUpperCase()) },
    {
      accessorKey: 'verified',
      header: 'Status',
      cell: ({ row }) => row.original.verified
        ? renderSnippet(createRawSnippet(() => ({ render: () => '<div class="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Verified</div>' })))
        : renderSnippet(createRawSnippet(() => ({ render: () => '<div class="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">Unverified</div>' }))),
    },
    {
      accessorKey: 'admin',
      header: 'Role',
      cell: ({ row }) => row.original.admin
        ? renderSnippet(createRawSnippet(() => ({ render: () => '<div class="inline-flex items-center rounded-md bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">Admin</div>' })))
        : renderSnippet(createRawSnippet(() => ({ render: () => '<span class="text-muted-foreground text-xs">User</span>' }))),
    },
    { accessorKey: 'created', header: 'Joined', cell: ({ row }) => s((row.original.created || '').slice(0, 10)) },
  ];

  const table = $derived(createSvelteTable({ get data() { return data.users; }, columns, getRowId: (r) => r.id, getCoreRowModel: getCoreRowModel() }));
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <p class="text-muted-foreground text-sm">{data.total} total</p>
    <div class="flex items-center gap-2">
      <Input bind:value={search} placeholder="Search users..." class="h-9 w-64" onkeydown={(e) => { if (e.key === 'Enter') doSearch(); }} />
      <Button variant="outline" onclick={doSearch}>Search</Button>
      <Button variant="outline" onclick={() => window.location.href = '/admin/users/export'}>Export CSV</Button>
    </div>
  </div>
  <Card>
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          {#each table.getHeaderGroups() as hg (hg.id)}
            <TableRow>
              {#each hg.headers as h (h.id)}
                <TableHead>
                  {#if !h.isPlaceholder}
                    <FlexRender content={h.column.columnDef.header} context={h.getContext()} />
                  {/if}
                </TableHead>
              {/each}
            </TableRow>
          {/each}
        </TableHeader>
        <TableBody>
          {#each table.getRowModel().rows as row (row.id)}
            <TableRow data-state={row.getIsSelected() && 'selected'}>
              {#each row.getVisibleCells() as cell (cell.id)}
                <TableCell>
                  <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                </TableCell>
              {/each}
            </TableRow>
          {:else}
            <TableRow>
              <TableCell colspan={columns.length} class="h-24 text-center">No results.</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
  <div class="flex items-center justify-between">
    <p class="text-muted-foreground text-sm">Page {data.page} of {Math.ceil(data.total / data.perPage) || 1}</p>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" disabled={data.page <= 1} onclick={prevPage}>Previous</Button>
      <Button variant="outline" size="sm" disabled={data.page * data.perPage >= data.total} onclick={nextPage}>Next</Button>
    </div>
  </div>
</div>
