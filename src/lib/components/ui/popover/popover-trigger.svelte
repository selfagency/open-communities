<script lang="ts">
import { Popover as PopoverPrimitive } from 'bits-ui';

import { cn } from '$lib/utils.js';

let { class: className, ref = $bindable(null), ...restProps }: PopoverPrimitive.TriggerProps = $props();
</script>

<PopoverPrimitive.Trigger class={cn('', className)} data-slot="popover-trigger" bind:ref {...restProps} />
