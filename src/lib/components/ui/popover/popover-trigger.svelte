<script lang="ts">
import { Popover as PopoverPrimitive } from 'bits-ui';

import { cn } from '$lib/utils.js';

let { class: className, ref = $bindable(null), ...restProps }: PopoverPrimitive.TriggerProps = $props();
</script>

<PopoverPrimitive.Trigger bind:ref data-slot="popover-trigger" class={cn('', className)} {...restProps} />
