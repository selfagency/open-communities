<script lang="ts">
import CancelIcon from '@tabler/icons-svelte/icons/cancel';
import TrashIcon from '@tabler/icons-svelte/icons/trash';
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as AlertDialog from '$lib/components/ui/alert-dialog';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

import { m } from '$lib/paraglide/messages';

let deleting = $state(false);
let open = $state(false);
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold text-destructive">{m.dangerZone()}</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <p class="text-muted-foreground text-sm">{m.deleteAccountDescription()}</p>
    <AlertDialog.Root bind:open>
      <AlertDialog.Trigger>
        <Button type="button" variant="destructive"><TrashIcon class="mr-1.5 size-4" />{m.deleteAccount()}</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <form
          action="?/deleteAccount"
          method="POST"
          use:enhance={() => {
        deleting = true;
        // biome-ignore lint/style/useBlockStatements: intentional single-expression block
        // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
        return async ({ result }) => { if (result.type === 'success') goto('/'); };
      }}
        >
          <AlertDialog.Header>
            <AlertDialog.Title>{m.deleteAccount()}</AlertDialog.Title>
            <AlertDialog.Description>
              {m.deleteAccountConfirmation()}
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel type="button"><CancelIcon class="mr-1.5 size-4" />{m.cancel()}</AlertDialog.Cancel>
            <AlertDialog.Action
              class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              type="submit"
            >
              {deleting ? m.deleting() : m.deleteAccount()}
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </form>
      </AlertDialog.Content>
    </AlertDialog.Root>
  </CardContent>
</Card>
