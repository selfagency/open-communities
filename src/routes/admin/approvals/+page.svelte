<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  let { data } = $props();

  function setTab(t: string) {
    window.location.href = `/admin/approvals?tab=${t}`;
  }

  async function approve(id: string) {
    await fetch(`/api/admin/congregations/${id}/toggle`, { method: 'POST' });
    window.location.reload();
  }

  async function reject(id: string) {
    await fetch(`/api/admin/congregations/${id}/delete`, { method: 'DELETE' });
    window.location.reload();
  }
</script>

<div class="px-4 lg:px-6">
  <div class="mb-6">
    <h1 class="text-2xl font-semibold">Approvals</h1>
    <p class="text-muted-foreground text-sm">{data.total} pending</p>
  </div>

  <!-- Tabs -->
  <div class="mb-4 flex gap-1">
    <Button variant={data.tab === 'new' ? 'default' : 'ghost'} size="sm" onclick={() => setTab('new')}>New Submissions</Button>
    <Button variant={data.tab === 'approved' ? 'default' : 'ghost'} size="sm" onclick={() => setTab('approved')}>Approved</Button>
  </div>

  <Card>
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Denomination</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Date</TableHead>
            {#if data.tab === 'new'}
              <TableHead class="text-right">Actions</TableHead>
            {/if}
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each data.congregations as cong}
            <TableRow>
              <TableCell class="font-medium">{cong.name}</TableCell>
              <TableCell class="capitalize">{cong.denomination ?? '—'}</TableCell>
              <TableCell class="text-muted-foreground text-xs">{cong.owner || '—'}</TableCell>
              <TableCell class="text-muted-foreground text-xs">{String(cong.created ?? '').slice(0, 10)}</TableCell>
              {#if data.tab === 'new'}
                <TableCell class="text-right">
                  <Button variant="default" size="sm" class="mr-2" onclick={() => approve(cong.id)}>Approve</Button>
                  <Button variant="destructive" size="sm" onclick={() => reject(cong.id)}>Reject</Button>
                </TableCell>
              {/if}
            </TableRow>
          {:else}
            <TableRow>
              <TableCell colspan="{data.tab === 'new' ? 5 : 4}" class="text-muted-foreground py-8 text-center">
                No congregations found
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
