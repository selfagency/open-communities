<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

import { cn, type WithElementRef } from '$lib/utils.js';

let {
  children,
  class: className,
  ref = $bindable(null),
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLUListElement>> = $props();
</script>

<ul
  class={cn('flex flex-row items-center gap-1', className)}
  data-slot="pagination-content"
  bind:this={ref}
  {...restProps}
>
  {@render children?.()}
</ul>
