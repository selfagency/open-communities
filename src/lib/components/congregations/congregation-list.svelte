<script lang="ts">
  import Fuzzy from '@leeoniya/ufuzzy';
  import CheckIcon from '@tabler/icons-svelte/icons/check';
  import XIcon from '@tabler/icons-svelte/icons/x';
  import PencilIcon from '@tabler/icons-svelte/icons/pencil';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';

  let { data }: { data: { congregations: any[]; active: any[]; pending: any[] } } = $props();
  let search = $state('');

  const searchStrings = $derived(data.congregations.map(
    (c: any) => `${c.name} ${c.denomination ?? ''} ${c.city ?? ''} ${c.state ?? ''}`
  ));
  const fuzzy = new Fuzzy();
  const filtered = $derived(
    search
      ? fuzzy.filter(searchStrings, search.toLowerCase())?.map(i => data.congregations[i]) ?? data.congregations
      : data.congregations
  );

  let pendingId = $state<string | null>(null);
  let pendingAction = $state<'approve' | 'reject' | null>(null);

  async function editUrl(id: string) { window.location.href = '/edit?id=' + id; }
  async function confirmAction() {
    if (!pendingId || !pendingAction) return;
    if (pendingAction === 'approve') {
      await fetch('/api/admin/congregations/' + pendingId + '/toggle', { method: 'POST' });
    } else {
      await fetch('/api/admin/congregations/' + pendingId + '/delete', { method: 'DELETE' });
    }
    pendingId = null;
    pendingAction = null;
    window.location.reload();
  }
</script>

<div class="space-y-8">
  <div class="flex items-center gap-2">
    <Input bind:value={search} placeholder="Search by name, denomination, location..." class="h-9 max-w-sm" />
    {#if search}<p class="text-muted-foreground text-sm">{filtered.length} results</p>{/if}
  </div>

  <div>
    <h2 class="mb-4 text-lg font-semibold">Congregations</h2>
    <p class="text-muted-foreground -mt-3 mb-4 text-sm">{data.active.length} approved</p>
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Denomination</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead class="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each filtered.filter((c: any) => c.visible) as cong}
              <TableRow>
                <TableCell class="font-medium">{cong.name}</TableCell>
                <TableCell class="capitalize">{cong.denomination ?? '—'}</TableCell>
                <TableCell class="text-muted-foreground">{cong.city}{cong.state ? `, ${cong.state}` : ''}{cong.countryCode && cong.countryCode !== 'US' ? ` (${cong.countryCode})` : ''}</TableCell>
                <TableCell class="text-muted-foreground text-xs">{cong.owner || '—'}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                    <TooltipTrigger>
                        <Button variant="ghost" size="icon" onclick={() => window.location.href = editUrl(cong.id)}>
                          <PencilIcon class="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit congregation</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            {:else}
              <TableRow><TableCell colspan={5} class="text-muted-foreground py-8 text-center">No approved congregations</TableCell></TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>

  {#if data.pending.length > 0}
    <div>
      <h2 class="mb-4 text-lg font-semibold">Approvals</h2>
      <p class="text-muted-foreground -mt-3 mb-4 text-sm">{data.pending.length} pending approval</p>
      <Card>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Denomination</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead class="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each data.pending as cong}
                <TableRow>
                  <TableCell class="font-medium">{cong.name}</TableCell>
                  <TableCell class="capitalize">{cong.denomination ?? '—'}</TableCell>
                  <TableCell class="text-muted-foreground text-xs">{cong.owner || '—'}</TableCell>
                  <TableCell class="text-muted-foreground text-xs">{String(cong.created ?? '').slice(0, 10)}</TableCell>
                  <TableCell>
                    <div class="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="ghost" size="icon" onclick={() => editUrl(cong.id)}>
                              <PencilIcon class="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit congregation</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger>
                          <Button variant="default" size="icon" class="size-8" onclick={() => { pendingId = cong.id; pendingAction = 'approve'; }}>
                            <CheckIcon class="size-4" />
                          </Button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content>
                          <AlertDialog.Header>
                            <AlertDialog.Title>Approve Congregation</AlertDialog.Title>
                            <AlertDialog.Description>Approve "{cong.name}" and make it visible on the directory?</AlertDialog.Description>
                          </AlertDialog.Header>
                          <AlertDialog.Footer>
                            <AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
                            <Button variant="default" onclick={confirmAction}>Approve</Button>
                          </AlertDialog.Footer>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger>
                          <Button variant="destructive" size="icon" class="size-8" onclick={() => { pendingId = cong.id; pendingAction = 'reject'; }}>
                            <XIcon class="size-4" />
                          </Button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content>
                          <AlertDialog.Header>
                            <AlertDialog.Title>Reject Congregation</AlertDialog.Title>
                            <AlertDialog.Description>Reject "{cong.name}"? This will delete the congregation permanently.</AlertDialog.Description>
                          </AlertDialog.Header>
                          <AlertDialog.Footer>
                            <AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
                            <Button variant="destructive" onclick={confirmAction}>Reject</Button>
                          </AlertDialog.Footer>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                    </div>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
