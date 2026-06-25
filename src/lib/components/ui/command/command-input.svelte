<script lang="ts">
import SearchIcon from '@tabler/icons-svelte/icons/search';
import { Command as CommandPrimitive } from 'bits-ui';

import { cn } from '$lib/utils.js';

let {
  class: className,
  ref = $bindable(null),
  value = $bindable(''),
  ...restProps
}: CommandPrimitive.InputProps = $props();
</script>

<div class="flex h-11 items-center gap-2 border-b px-3" data-slot="command-input-wrapper">
  <SearchIcon class="size-4 shrink-0 opacity-50" />
  <CommandPrimitive.Input
    class={cn(
      'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    data-slot="command-input"
    bind:ref
    {...restProps}
    bind:value
  />
</div>
