<script lang="ts">
import * as FormPrimitive from 'formsnap';

import { Label } from '$lib/components/ui/label/index.js';
import { cn, type WithoutChild } from '$lib/utils.js';

let {
  children,
  class: className,
  for: htmlFor,
  ref = $bindable(null),
  ...restProps
}: WithoutChild<FormPrimitive.LabelProps> & { for?: string } = $props();
</script>

<FormPrimitive.Label {...restProps} bind:ref>
  {#snippet child({ props })}
    <Label {...props} for={htmlFor} data-slot="form-label" class={cn('data-[fs-error]:text-destructive', className)}>
      {@render children?.()}
    </Label>
  {/snippet}
</FormPrimitive.Label>
