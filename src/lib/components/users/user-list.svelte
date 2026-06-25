<script lang="ts">
  import PencilIcon from '@tabler/icons-svelte/icons/pencil';
  import SearchIcon from '@tabler/icons-svelte/icons/search';
  import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
  import { createRawSnippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { createSvelteTable, FlexRender, renderSnippet } from '$lib/components/ui/data-table/index.js';
  import { Input } from '$lib/components/ui/input';
  import * as Pagination from '$lib/components/ui/pagination';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { m } from '$lib/paraglide/messages';

  interface User { id: string; name: string; email: string; verified: boolean; admin: boolean; congregation: string; congregationName: string; }

  let { data }: { data: { users: User[]; total: number; page: number; perPage: number; search: string } } = $props();
  let search = $state(data.search);

  let currentPage = $state(data.page);

  function doSearch() {
    const params = new URLSearchParams(page.url.searchParams);
    if (search) params.set('q', search); else params.delete('q');
    params.set('page', '1');
    goto('/admin/users?' + params);
  }
  function onPageChange(p: number) {
    currentPage = p;
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', String(p));
    goto('/admin/users?' + params);
  }

  function s(content: string): string {
    return content;
  }

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: m.name(), cell: ({ row }) => s(row.original.name || '—') },
    { accessorKey: 'email', header: m.email(), cell: ({ row }) => s(row.original.email) },
    {
      accessorKey: 'verified',
      header: m.status(),
      cell: ({ row }) => row.original.verified
        ? renderSnippet(createRawSnippet(() => ({ render: () => `<div class="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">${m.verified()}</div>` })))
        : renderSnippet(createRawSnippet(() => ({ render: () => `<div class="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">${m.unverified()}</div>` }))),
    },
    {
      accessorKey: 'admin',
      header: m.role(),
      cell: ({ row }) => row.original.admin
        ? renderSnippet(createRawSnippet(() => ({ render: () => `<div class="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">${m.admin()}</div>` })))
        : renderSnippet(createRawSnippet(() => ({ render: () => `<div class="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">${m.user()}</div>` }))),
    },
    {
      id: 'congregation',
      header: m.congregation(),
      cell: ({ row }) => row.original.congregation
        ? renderSnippet(createRawSnippet<[{ n: string; i: string }]>((get) => ({ render: () => `<a href="/edit?id=${get().i}" class="text-sm underline-offset-4 hover:underline">${get().n}</a>` })), { n: row.original.congregationName, i: row.original.congregation })
        : renderSnippet(createRawSnippet(() => ({ render: () => '<span class="text-muted-foreground text-xs">—</span>' }))),
    },
  ];

  const table = $derived(createSvelteTable({ get data() { return data.users; }, columns, getRowId: (r) => r.id, getCoreRowModel: getCoreRowModel() }));
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-2xl font-semibold">{m.adminUsers()}</h2>
    </div>
    <div class="flex items-center gap-2">
      <div class="relative shadow-xs">
        <SearchIcon size="18" class="absolute left-3 z-10 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        <Input bind:value={search} placeholder={m.searchUsers()} class="h-11 w-64 sm:w-80 pl-10" onkeydown={(e) => { if (e.key === 'Enter') doSearch(); }} />
      </div>
      <Button variant="outline" onclick={() => goto('/admin/users/export')}>{m.exportCsv()}</Button>
    </div>
  </div>
  <Card>
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          {#each table.getHeaderGroups() as hg (hg.id)}
            <TableRow>
              {#each hg.headers as h (h.id)}
                <TableHead class="font-bold">
                  {#if !h.isPlaceholder}
                    <FlexRender content={h.column.columnDef.header} context={h.getContext()} />
                  {/if}
                </TableHead>
              {/each}
              <TableHead class="w-10"></TableHead>
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
              <TableCell>
                <Button variant="ghost" size="icon" onclick={() => goto('/admin/users/' + row.original.id)}>
                  <PencilIcon class="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          {:else}
            <TableRow>
              <TableCell colspan={columns.length + 1} class="h-24 text-center">{m.noResults()}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
  <div class="flex w-full scale-90 flex-row items-center justify-center pt-4 sm:scale-100">
    <Pagination.Root
      count={data.total}
      perPage={data.perPage}
      page={currentPage}
      onPageChange={onPageChange}
      siblingCount={0}
    >
      {#snippet children({ pages })}
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.PrevButton />
          </Pagination.Item>
          {#each pages as page (page.key)}
            {#if page.type === "ellipsis"}
              <Pagination.Item>
                <Pagination.Ellipsis />
              </Pagination.Item>
            {:else}
              <Pagination.Item>
                <Pagination.Link {page} isActive={currentPage == page.value}>
                  {page.value}
                </Pagination.Link>
              </Pagination.Item>
            {/if}
          {/each}
          <Pagination.Item>
            <Pagination.NextButton />
          </Pagination.Item>
        </Pagination.Content>
      {/snippet}
    </Pagination.Root>
  </div>
</div>
