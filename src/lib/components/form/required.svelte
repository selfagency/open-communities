<script lang="ts">
/* region imports */
import { Badge } from '$lib/components/ui/badge';
import { m } from '$lib/paraglide/messages';

/* endregion imports */

/* region variables */
// props
let { set = $bindable(false) }: { set: boolean } = $props();
/* endregion variables */
</script>

<Badge
  class={set ? 'bg-muted text-muted-foreground' : 'border-destructive/20 bg-destructive/10 text-destructive'}
  variant="outline"
>
  <span class="font-normal">{m.required()}</span>
</Badge>
