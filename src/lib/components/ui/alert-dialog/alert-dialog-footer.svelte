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
  class={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
  data-slot="alert-dialog-footer"
  bind:this={ref}
  {...restProps}
>
  {@render children?.()}
</div>
