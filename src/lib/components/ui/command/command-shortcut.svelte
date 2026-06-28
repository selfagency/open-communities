<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

import { cn, type WithElementRef } from '$lib/utils.js';

let {
  children,
  class: className,
  ref = $bindable(null),
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
  class={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)}
  data-slot="command-shortcut"
  bind:this={ref}
  {...restProps}
>
  {@render children?.()}
</span>
