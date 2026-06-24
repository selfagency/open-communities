<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  let { onDelete }: { onDelete: (formData: FormData) => { result: Promise<{ type: string }> } | void } = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg text-destructive">Danger Zone</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <p class="text-muted-foreground text-sm">Permanently delete your account and all associated data.</p>
    <form method="POST" action="?/deleteAccount" use:enhance={onDelete}>
      <Button variant="destructive" type="submit">Delete Account</Button>
    </form>
  </CardContent>
</Card>
