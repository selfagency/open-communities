<script lang="ts">
  import { createColumnHelper } from '@tanstack/table-core';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { FlexRender, createSvelteTable } from '$lib/components/ui/data-table/index.js';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  interface Page { id: string; title: string; slug: string; lang: string; published: boolean; updated: string; }

  let { data }: { data: { pages: Page[] } } = $props();

  const colHelper = createColumnHelper<Page>();
  const columns = [
    colHelper.accessor('title', { header: 'Title', cell: ({ row }) => row.original.id }),
    colHelper.accessor('slug', { header: 'Slug', cell: ({ row }) => row.original.id }),
    colHelper.accessor('lang', { header: 'Language', cell: ({ row }) => row.original.id }),
    colHelper.accessor('published', { header: 'Status', cell: ({ row }) => row.original.id }),
    colHelper.accessor('updated', { header: 'Updated', cell: ({ row }) => row.original.id }),
  ];

  const table = $derived(createSvelteTable({ data: data.pages, columns, getRowId: (r) => r.id }));
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
                {#if cell.column.id === 'published'}
                  <TableCell>
                    {#if row.original.published}
                      <Badge variant="default" class="text-xs">Published</Badge>
                    {:else}
                      <Badge variant="secondary" class="text-xs">Draft</Badge>
                    {/if}
                  </TableCell>
                {:else if cell.column.id === 'title'}
                  <TableCell class="font-medium">{row.original.title}</TableCell>
                {:else if cell.column.id === 'slug'}
                  <TableCell class="text-muted-foreground font-mono text-xs">/{row.original.slug}</TableCell>
                {:else if cell.column.id === 'lang'}
                  <TableCell class="uppercase text-xs">{row.original.lang ?? 'en'}</TableCell>
                {:else if cell.column.id === 'updated'}
                  <TableCell class="text-muted-foreground text-xs">{String(row.original.updated ?? '').slice(0, 10)}</TableCell>
                {:else}
                  <TableCell>{cell.getValue() as string}</TableCell>
                {/if}
              {/each}
            </TableRow>
          {:else}
            <TableRow><TableCell colspan={5} class="text-muted-foreground py-8 text-center">No pages yet</TableCell></TableRow>
          {/each}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
