<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';

let {
  ref = $bindable(null),
  class: className,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
  class={cn("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", className)}
  data-slot="table-row"
  bind:this={ref}
  {...restProps}
>
  {@render children?.()}
</tr>
