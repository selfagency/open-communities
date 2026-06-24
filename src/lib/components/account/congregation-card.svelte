<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  let {
    congregation,
    onUnlink,
  }: {
    congregation: string;
    onUnlink: () => void;
  } = $props();
</script>

{#if congregation}
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Congregation</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-muted-foreground text-sm">You are linked to a congregation. You can unlink to manage a different one.</p>
      <form method="POST" action="?/unlink" use:enhance={onUnlink}>
        <Button variant="outline" type="submit">Unlink from Congregation</Button>
      </form>
      <Button variant="outline" onclick={() => goto('/edit?id=' + congregation)}>Edit Congregation</Button>
    </CardContent>
  </Card>
{/if}
