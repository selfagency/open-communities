<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
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
        <Button variant="destructive" type="button">{m.deleteAccount()}</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <form method="POST" action="?/deleteAccount" use:enhance={() => {
        deleting = true;
        return async ({ result }) => { if (result.type === 'success') goto('/'); };
      }}>
          <AlertDialog.Header>
            <AlertDialog.Title>{m.deleteAccount()}</AlertDialog.Title>
            <AlertDialog.Description>
              {m.deleteAccountConfirmation()}
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
          <AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
          <AlertDialog.Action
            type="submit"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleting}
          >
            {deleting ? m.deleting() : m.deleteAccount()}
          </AlertDialog.Action>
          </AlertDialog.Footer>
        </form>
      </AlertDialog.Content>
    </AlertDialog.Root>
  </CardContent>
</Card>
