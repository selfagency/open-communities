<script lang="ts">
  import Pencil from '@lucide/svelte/icons/pencil';
  import { goto } from '$app/navigation';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  let { data } = $props();
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Pages</h1>
    <span class="text-sm text-muted-foreground">{data.pages.length} total</span>
  </div>

  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Language</TableHead>
          <TableHead>Created</TableHead>
          <TableHead class="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each data.pages as page}
          <TableRow>
            <TableCell>{page.title}</TableCell>
            <TableCell><code class="text-xs">{page.slug}</code></TableCell>
            <TableCell>{page.lang || 'en'}</TableCell>
            <TableCell>{new Date(page.created).toLocaleDateString()}</TableCell>
            <TableCell>
              <Button variant="ghost" size="icon-sm" onclick={() => goto(`/admin/pages/${page.id}`)}>
                <Pencil class="size-4" />
                <span class="sr-only">Edit</span>
              </Button>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</div>
