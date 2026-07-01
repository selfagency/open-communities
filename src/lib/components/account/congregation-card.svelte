<script lang="ts">
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
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
      <form action="?/unlink" method="POST" use:enhance={onUnlink}>
        <Button type="submit" variant="outline">{m.unlinkFromCongregation()}</Button>
      </form>
      <Button onclick={() => goto(resolve(`/edit?id=${congregation}`))} variant="outline">
        {m.editCongregation()}
      </Button>
    </CardContent>
  </Card>
{/if}
