<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  let deleting = $state(false);
  let open = $state(false);
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold text-destructive">Danger Zone</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <p class="text-muted-foreground text-sm">Permanently delete your account and all associated data.</p>
    <AlertDialog.Root bind:open>
      <AlertDialog.Trigger>
        <Button variant="destructive" type="button">Delete Account</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <form method="POST" action="?/deleteAccount" use:enhance={() => {
        deleting = true;
        return async ({ result }) => { if (result.type === 'success') goto('/'); };
      }}>
          <AlertDialog.Header>
            <AlertDialog.Title>Delete Account</AlertDialog.Title>
            <AlertDialog.Description>
              This action cannot be undone. Your account and all associated data will be permanently deleted.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
            <Button variant="destructive" type="submit" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </AlertDialog.Footer>
        </form>
      </AlertDialog.Content>
    </AlertDialog.Root>
  </CardContent>
</Card>
