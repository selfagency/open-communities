<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';

  let { data }: { data: { pages: any[] } } = $props();
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
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each data.pages as p}
            <TableRow>
              <TableCell class="font-medium">{p.title}</TableCell>
              <TableCell class="text-muted-foreground font-mono text-xs">/{p.slug}</TableCell>
              <TableCell class="uppercase text-xs">{p.lang ?? 'en'}</TableCell>
              <TableCell>{#if p.published}<Badge variant="default" class="text-xs">Published</Badge>{:else}<Badge variant="secondary" class="text-xs">Draft</Badge>{/if}</TableCell>
              <TableCell class="text-muted-foreground text-xs">{String(p.updated ?? '').slice(0, 10)}</TableCell>
            </TableRow>
          {:else}
            <TableRow><TableCell colspan="5" class="text-muted-foreground py-8 text-center">No pages yet</TableCell></TableRow>
          {/each}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
