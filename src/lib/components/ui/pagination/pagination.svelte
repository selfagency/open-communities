<script lang="ts">
import { Pagination as PaginationPrimitive } from 'bits-ui';
import { m } from '$lib/paraglide/messages';
import { cn } from '$lib/utils.js';

let {
  class: className,
  count = 0,
  page = $bindable(1),
  perPage = 10,
  ref = $bindable(null),
  siblingCount = 1,
  ...restProps
}: PaginationPrimitive.RootProps = $props();
</script>

<PaginationPrimitive.Root
  aria-label={m.pagination()}
  class={cn('mx-auto flex w-full justify-center', className)}
  {count}
  data-slot="pagination"
  {perPage}
  role="navigation"
  {siblingCount}
  bind:page
  bind:ref
  {...restProps}
/>
