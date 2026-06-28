<script lang="ts">
import CircleIcon from '@tabler/icons-svelte/icons/circle';
import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';

import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

let {
  class: className,
  ref = $bindable(null),
  ...restProps
}: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> = $props();
</script>

<RadioGroupPrimitive.Item
  class={cn(
    'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  data-slot="radio-group-item"
  bind:ref
  {...restProps}
>
  {#snippet children({ checked })}
    <div class="relative flex items-center justify-center" data-slot="radio-group-indicator">
      {#if checked}
        <CircleIcon class="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      {/if}
    </div>
  {/snippet}
</RadioGroupPrimitive.Item>
