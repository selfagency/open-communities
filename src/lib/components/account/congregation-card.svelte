<script lang="ts">
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
import { m } from '$lib/paraglide/messages';

let {
  congregation,
  onUnlink
}: {
  congregation: string;
  onUnlink: () => void;
} = $props();
</script>

{#if congregation}
  <Card>
    <CardHeader>
      <CardTitle class="text-lg font-bold">{m.congregation()}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-muted-foreground text-sm">{m.linkedDescription()}</p>
      <form method="POST" action="?/unlink" use:enhance={onUnlink}>
        <Button variant="outline" type="submit">{m.unlinkFromCongregation()}</Button>
      </form>
      <Button variant="outline" onclick={() => goto('/edit?id=' + congregation)}>{m.editCongregation()}</Button>
    </CardContent>
  </Card>
{/if}
