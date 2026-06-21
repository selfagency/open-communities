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

<Badge variant="outline" class={set ? 'bg-slate-50 text-slate-500' : 'border-red-100 bg-red-50 text-red-400'}>
  <span class="font-normal">{m.required()}</span>
</Badge>
