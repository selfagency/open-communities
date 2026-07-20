<script lang="ts">
import ExternalLinkIcon from '@tabler/icons-svelte/icons/external-link';
import FilesIcon from '@tabler/icons-svelte/icons/files';
import PencilIcon from '@tabler/icons-svelte/icons/pencil';
import PlusIcon from '@tabler/icons-svelte/icons/plus';
import SearchIcon from '@tabler/icons-svelte/icons/search';

import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import { goto } from '$app/navigation';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent } from '$lib/components/ui/card';
import { createSvelteTable, FlexRender, renderSnippet } from '$lib/components/ui/data-table/index.js';
import { Input } from '$lib/components/ui/input';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Pagination from '$lib/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
import { m } from '$lib/paraglide/messages';

interface Page {
  description: string;
  id: string;
  imageAlt?: string;
  imageCaption?: string;
  published: boolean;
  slug: string;
  title: string;
  updated: string;
}

let { data }: { data: { pages: Page[] } } = $props();
let search = $state('');

const filtered = $derived(
  search
    ? data.pages.filter((p) => {
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      })
    : data.pages
);

const PER_PAGE = 18;
let currentPage = $state(1);
const paginated = $derived(filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE));

function onPageChange(p: number) {
  currentPage = p;
}

// Reset to page 1 when search changes
$effect(() => {
  // biome-ignore lint/suspicious/noUnusedExpressions: intentional expression
  filtered.length;
  currentPage = 1;
});

const columns: ColumnDef<Page>[] = [
  {
    accessorKey: 'title',
    header: m.pageTitle(),
    size: 200,
    cell: ({ row }) =>
      renderSnippet(
        createRawSnippet<[{ v: string }]>((get) => ({ render: () => `<span class="font-medium">${get().v}</span>` })),
        { v: row.original.title }
      )
  },
  {
    accessorKey: 'slug',
    header: m.slug(),
    size: 100,
    cell: ({ row }) =>
      renderSnippet(
        createRawSnippet<[{ v: string }]>((get) => ({
          render: () => `<span class="text-muted-foreground font-mono text-xs truncate inline-block">/${get().v}</span>`
        })),
        { v: row.original.slug }
      )
  },
  {
    accessorKey: 'published',
    header: 'Published',
    size: 80,
    cell: ({ row }) =>
      renderSnippet(
        createRawSnippet<[{ v: boolean }]>((get) => ({
          render: () =>
            get().v
              ? '<span class="text-xs text-green-600 font-medium">Yes</span>'
              : '<span class="text-xs text-muted-foreground">No</span>'
        })),
        { v: row.original.published }
      )
  },
  {
    accessorKey: 'description',
    header: m.description(),
    size: 380,
    cell: ({ row }) =>
      renderSnippet(
        createRawSnippet<[{ v: string }]>((get) => ({
          render: () =>
            `<span class="text-muted-foreground text-xs truncate inline-block max-w-sm">${get().v || '—'}</span>`
        })),
        { v: row.original.description }
      )
  },
  {
    accessorKey: 'updated',
    header: m.updated(),
    size: 120,
    cell: ({ row }) =>
      renderSnippet(
        createRawSnippet<[{ v: string }]>((get) => ({
          render: () => `<span class="text-muted-foreground text-xs">${(get().v || '').slice(0, 10)}</span>`
        })),
        { v: row.original.updated }
      )
  }
];

const table = $derived(
  createSvelteTable({
    get data() {
      return paginated;
    },
    columns,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel()
  })
);
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="flex items-center gap-2 text-2xl font-semibold">
        <FilesIcon class="size-6" />
        {m.pages()}
      </h2>
    </div>
    <div class="flex items-center gap-2">
      <div class="relative shadow-xs">
        <SearchIcon
          class="absolute left-3 z-10 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
          size="18"
        />
        <Input class="h-11 w-64 sm:w-80 pl-10" placeholder={m.searchPages()} bind:value={search} />
      </div>
      <Button onclick={() => goto('/admin/pages/new')} variant="outline"
        ><PlusIcon class="mr-1.5 size-4" />{m.newPage()}</Button
      >
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
                <Button onclick={() => goto('/admin/pages/' + row.original.id)} size="icon" variant="ghost">
                  <PencilIcon class="size-4" />
                </Button>
              </TableCell>
              <TableCell>
                <a href={'/' + row.original.slug} rel="noopener" target="_blank">
                  <Button size="icon" variant="ghost">
                    <ExternalLinkIcon class="size-4" />
                  </Button>
                </a>
              </TableCell>
            </TableRow>
          {:else}
            <TableRow>
              <TableCell class="h-24 text-center" colspan={columns.length + 2}>{m.noResults()}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
  <div class="flex w-full scale-90 flex-row items-center justify-center pt-2 sm:scale-100">
    <Pagination.Root count={filtered.length} {onPageChange} page={currentPage} perPage={PER_PAGE} siblingCount={0}>
      {#snippet children({ pages })}
        <Pagination.Content>
          <Pagination.Item><Pagination.PrevButton /></Pagination.Item>
          {#each pages as page (page.key)}
            {#if page.type === "ellipsis"}
              <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
            {:else}
              <Pagination.Item
                ><Pagination.Link isActive={currentPage == page.value} {page}
                  >{page.value}</Pagination.Link
                ></Pagination.Item
              >
            {/if}
          {/each}
          <Pagination.Item><Pagination.NextButton /></Pagination.Item>
        </Pagination.Content>
      {/snippet}
    </Pagination.Root>
  </div>
</div>
