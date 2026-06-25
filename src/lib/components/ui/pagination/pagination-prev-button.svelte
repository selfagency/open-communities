<script lang="ts">
import ChevronLeftIcon from '@tabler/icons-svelte/icons/chevron-left';
import { Pagination as PaginationPrimitive } from 'bits-ui';

import { buttonVariants } from '$lib/components/ui/button/index.js';
import { m } from '$lib/paraglide/messages';
import { cn } from '$lib/utils.js';

let { children, class: className, ref = $bindable(null), ...restProps }: PaginationPrimitive.PrevButtonProps = $props();
</script>

{#snippet Fallback()}
  <ChevronLeftIcon class="size-4" />
  <span>{m.prev()}</span>
{/snippet}

<PaginationPrimitive.PrevButton
  aria-label={m.paginationPrevious()}
  children={children || Fallback}
  class={cn(
    buttonVariants({
      class: 'gap-1 px-2.5 sm:pl-2.5',
      size: 'default',
      variant: 'ghost'
    }),
    className
  )}
  bind:ref
  {...restProps}
/>
