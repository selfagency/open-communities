<script lang="ts">
import ChevronRightIcon from '@tabler/icons-svelte/icons/chevron-right';
import type { HTMLLiAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';

let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li
  aria-hidden="true"
  class={cn("[&>svg]:size-3.5", className)}
  data-slot="breadcrumb-separator"
  role="presentation"
  bind:this={ref}
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    <ChevronRightIcon />
  {/if}
</li>
