<script lang="ts">
  import { page } from '$app/state';
  import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { FlexRender, createSvelteTable } from '$lib/components/ui/data-table/index.js';
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

  const colHelper = createColumnHelper<User>();
  const columns = [
    colHelper.accessor('name', { header: 'Name', cell: ({ row }) => row.original.id }),
    colHelper.accessor('email', { header: 'Email', cell: ({ row }) => row.original.id }),
    colHelper.accessor('lang', { header: 'Language', cell: ({ row }) => row.original.id }),
    colHelper.accessor('verified', { header: 'Status', cell: ({ row }) => row.original.id }),
    colHelper.accessor('admin', { header: 'Role', cell: ({ row }) => row.original.id }),
    colHelper.accessor('created', { header: 'Joined', cell: ({ row }) => row.original.id }),
  ];

  const table = $derived(createSvelteTable({ data: data.users, columns, getRowId: (r) => r.id, getCoreRowModel: getCoreRowModel() }));
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
          {#each table.getHeaderGroups() as hg}
            <TableRow>
              {#each hg.headers as h}
                <TableHead><FlexRender content={h.column.columnDef.header} context={h.getContext()} /></TableHead>
              {/each}
            </TableRow>
          {/each}
        </TableHeader>
        <TableBody>
          {#each table.getRowModel().rows as row}
            <TableRow>
              {#each row.getVisibleCells() as cell}
                {#if cell.column.id === 'verified'}
                  <TableCell>
                    {#if cell.getValue()}
                      <Badge variant="default" class="text-xs">Verified</Badge>
                    {:else}
                      <Badge variant="secondary" class="text-xs">Unverified</Badge>
                    {/if}
                  </TableCell>
                {:else if cell.column.id === 'admin'}
                  <TableCell>
                    {#if cell.getValue()}
                      <Badge variant="default" class="bg-amber-500 text-xs hover:bg-amber-500">Admin</Badge>
                    {:else}
                      <span class="text-muted-foreground text-xs">User</span>
                    {/if}
                  </TableCell>
                {:else if cell.column.id === 'name'}
                  <TableCell class="font-medium">{row.original.name || '—'}</TableCell>
                {:else if cell.column.id === 'lang'}
                  <TableCell class="uppercase text-xs">{row.original.lang ?? 'en'}</TableCell>
                {:else if cell.column.id === 'created'}
                  <TableCell class="text-muted-foreground text-xs">{String(row.original.created ?? '').slice(0, 10)}</TableCell>
                {:else}
                  <TableCell>{cell.getValue() as string}</TableCell>
                {/if}
              {/each}
            </TableRow>
          {:else}
            <TableRow><TableCell colspan={6} class="text-muted-foreground py-8 text-center">No users found</TableCell></TableRow>
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
