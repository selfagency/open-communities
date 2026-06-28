<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';

let {
  ref = $bindable(null),
  class: className,
  inset,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
  inset?: boolean;
} = $props();
</script>

<div
  class={cn("text-muted-foreground px-1.5 py-1 text-xs font-medium data-inset:pl-7 data-[inset]:pl-8", className)}
  data-inset={inset}
  data-slot="dropdown-menu-label"
  bind:this={ref}
  {...restProps}
>
  {@render children?.()}
</div>
