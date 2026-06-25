<script lang="ts">
import { Pagination as PaginationPrimitive } from 'bits-ui';

import { buttonVariants, type Props } from '$lib/components/ui/button/index.js';
import { cn } from '$lib/utils.js';

let {
  children,
  class: className,
  isActive,
  page,
  ref = $bindable(null),
  size = 'icon',
  ...restProps
}: PaginationPrimitive.PageProps &
  Props & {
    isActive: boolean;
  } = $props();
</script>

{#snippet Fallback()}
  {page.value}
{/snippet}

<PaginationPrimitive.Page
  aria-current={isActive ? 'page' : undefined}
  children={children || Fallback}
  class={cn(
    buttonVariants({
      size,
      variant: isActive ? 'outline' : 'ghost'
    }),
    className
  )}
  data-active={isActive}
  data-slot="pagination-link"
  {page}
  bind:ref
  {...restProps}
/>
