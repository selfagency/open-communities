<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';

let {
  ref = $bindable(null),
  class: className,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
  aria-current="page"
  aria-disabled="true"
  class={cn("text-foreground font-normal", className)}
  data-slot="breadcrumb-page"
  role="link"
  tabindex="-1"
  bind:this={ref}
  {...restProps}
>
  {@render children?.()}
</span>
