<script lang="ts">
  import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
  import { createRawSnippet } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { createSvelteTable, FlexRender, renderSnippet } from '$lib/components/ui/data-table/index.js';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  interface Page { id: string; title: string; slug: string; lang: string; published: boolean; updated: string; }

  let { data }: { data: { pages: Page[] } } = $props();

  const columns: ColumnDef<Page>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => renderSnippet(createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="font-medium">${get().v}</span>` })), { v: row.original.title }) },
    { accessorKey: 'slug', header: 'Slug', cell: ({ row }) => renderSnippet(createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="text-muted-foreground font-mono text-xs">/${get().v}</span>` })), { v: row.original.slug }) },
    { accessorKey: 'lang', header: 'Language', cell: ({ row }) => renderSnippet(createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="uppercase text-xs">${get().v || 'en'}</span>` })), { v: row.original.lang }) },
    {
      accessorKey: 'published',
      header: 'Status',
      cell: ({ row }) => row.original.published
        ? renderSnippet(createRawSnippet(() => ({ render: () => '<span class="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Published</span>' })))
        : renderSnippet(createRawSnippet(() => ({ render: () => '<span class="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">Draft</span>' }))),
    },
    { accessorKey: 'updated', header: 'Updated', cell: ({ row }) => renderSnippet(createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="text-muted-foreground text-xs">${(get().v || '').slice(0, 10)}</span>` })), { v: row.original.updated }) },
  ];

  const table = $derived(createSvelteTable({ get data() { return data.pages; }, columns, getRowId: (r) => r.id, getCoreRowModel: getCoreRowModel() }));
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <p class="text-muted-foreground text-sm">{data.pages.length} pages</p>
    <Button variant="default" onclick={() => window.location.href = '/admin/pages/new'}>New Page</Button>
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
</div>
