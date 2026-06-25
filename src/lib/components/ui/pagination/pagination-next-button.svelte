<script lang="ts">
import ChevronRightIcon from '@tabler/icons-svelte/icons/chevron-right';
import { Pagination as PaginationPrimitive } from 'bits-ui';

import { buttonVariants } from '$lib/components/ui/button/index.js';
import { m } from '$lib/paraglide/messages';
import { cn } from '$lib/utils.js';

let { children, class: className, ref = $bindable(null), ...restProps }: PaginationPrimitive.NextButtonProps = $props();
</script>

{#snippet Fallback()}
  <span>{m.next()}</span>
  <ChevronRightIcon class="size-4" />
{/snippet}

<PaginationPrimitive.NextButton
  aria-label={m.paginationNext()}
  children={children || Fallback}
  class={cn(
    buttonVariants({
      class: 'gap-1 px-2.5 sm:pr-2.5',
      size: 'default',
      variant: 'ghost'
    }),
    className
  )}
  bind:ref
  {...restProps}
/>
