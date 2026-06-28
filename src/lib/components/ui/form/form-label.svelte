<script lang="ts">
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
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
    <Label {...props} class={cn('data-[fs-error]:text-destructive', className)} data-slot="form-label" for={htmlFor}>
      {@render children?.()}
    </Label>
  {/snippet}
</FormPrimitive.Label>
