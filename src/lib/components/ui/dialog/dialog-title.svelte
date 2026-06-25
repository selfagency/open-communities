<script lang="ts">
import { Dialog as DialogPrimitive } from 'bits-ui';

import { cn } from '$lib/utils.js';

let { class: className, ref = $bindable(null), ...restProps }: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title
  class={cn('text-lg leading-none font-semibold', className)}
  data-slot="dialog-title"
  bind:ref
  {...restProps}
/>
