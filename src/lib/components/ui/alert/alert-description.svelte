<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

import { cn, type WithElementRef } from '$lib/utils.js';

let {
  children,
  class: className,
  ref = $bindable(null),
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  class={cn(
    'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
    className
  )}
  data-slot="alert-description"
  bind:this={ref}
  {...restProps}
>
  {@render children?.()}
</div>
