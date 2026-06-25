<script lang="ts">
import EllipsisIcon from '@tabler/icons-svelte/icons/dots';
import type { HTMLAttributes } from 'svelte/elements';

import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js';

let {
  class: className,
  ref = $bindable(null),
  ...restProps
}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<span
  aria-hidden="true"
  class={cn('flex size-9 items-center justify-center', className)}
  data-slot="pagination-ellipsis"
  bind:this={ref}
  {...restProps}
>
  <EllipsisIcon class="size-4" />
  <span class="sr-only">More pages</span>
</span>
