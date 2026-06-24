<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import X from '@lucide/svelte/icons/x';
  import { toast } from 'svelte-sonner';
  import { enhance } from '$app/forms';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';

  let { data } = $props();

  let tabValue = $state('new');
  let rejectReason = $state('');
  let rejectId = $state('');
  let rejectDialogOpen = $state(false);

  function openReject(id: string) {
    rejectId = id;
    rejectReason = '';
    rejectDialogOpen = true;
  }

  type LocationValue = { city?: { name?: string }; state?: { name?: string } };
</script>

<div class="space-y-4">
  <h1 class="text-2xl font-bold">Approvals</h1>

  <Tabs bind:value={tabValue}>
    <TabsList>
      <TabsTrigger value="new">New Submissions ({data.newSubmissions.length})</TabsTrigger>
      <TabsTrigger value="changes">Pending Changes ({data.pendingChanges.length})</TabsTrigger>
    </TabsList>

    <TabsContent value="new">
      {#if data.newSubmissions.length === 0}
        <Card>
          <CardContent class="py-8 text-center text-muted-foreground">
            No new submissions pending review.
          </CardContent>
        </Card>
      {:else}
        <div class="space-y-3">
          {#each data.newSubmissions as item}
            {@const loc = item.location as LocationValue | null}
            <Card>
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle class="text-lg">{item.name || 'Unnamed'}</CardTitle>
                    <CardDescription>
                      {loc?.city?.name ? `${loc.city.name}, ` : ''}
                      {loc?.state?.name || ''}
                      {#if item.denomination} · {item.denomination}{/if}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">New</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div class="flex items-center gap-2">
                  <form method="POST" action="?/approve" use:enhance={() => {
                    return async ({ update }) => { await update(); toast.success('Approved'); };
                  }}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" size="sm">
                      <Check class="mr-1 size-4" /> Approve
                    </Button>
                  </form>
                  <Button variant="destructive" size="sm" onclick={() => openReject(item.id)}>
                    <X class="mr-1 size-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}
    </TabsContent>

    <TabsContent value="changes">
      {#if data.pendingChanges.length === 0}
        <Card>
          <CardContent class="py-8 text-center text-muted-foreground">
            No pending changes to review.
          </CardContent>
        </Card>
      {:else}
        <div class="space-y-3">
          {#each data.pendingChanges as item}
            {@const loc = item.location as LocationValue | null}
            <Card>
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle class="text-lg">{item.name || 'Unnamed'}</CardTitle>
                    <CardDescription>
                      {loc?.city?.name ? `${loc.city.name}, ` : ''}
                      {loc?.state?.name || ''}
                      {#if item.denomination} · {item.denomination}{/if}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Edit</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div class="flex items-center gap-2">
                  <form method="POST" action="?/approve" use:enhance={() => {
                    return async ({ update }) => { await update(); toast.success('Approved'); };
                  }}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" size="sm">
                      <Check class="mr-1 size-4" /> Approve
                    </Button>
                  </form>
                  <Button variant="destructive" size="sm" onclick={() => openReject(item.id)}>
                    <X class="mr-1 size-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}
    </TabsContent>
  </Tabs>
</div>

<AlertDialog.Root bind:open={rejectDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Reject Submission</AlertDialog.Title>
      <AlertDialog.Description>
        Provide a reason for rejection. The submitter will be notified.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <form method="POST" action="?/reject" use:enhance={() => {
      return async ({ update }) => { await update(); rejectDialogOpen = false; toast.success('Rejected'); };
    }}>
      <input type="hidden" name="id" value={rejectId} />
      <div class="py-4">
        <Input
          name="reason"
          bind:value={rejectReason}
          placeholder="Reason for rejection..."
        />
      </div>
      <AlertDialog.Footer>
        <AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
        <AlertDialog.Action type="submit" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Reject
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </form>
  </AlertDialog.Content>
</AlertDialog.Root>
