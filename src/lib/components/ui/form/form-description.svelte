<script lang="ts">
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as FormPrimitive from 'formsnap';

import { cn, type WithoutChild } from '$lib/utils.js';

let { class: className, ref = $bindable(null), ...restProps }: WithoutChild<FormPrimitive.DescriptionProps> = $props();
</script>

<FormPrimitive.Description
  class={cn('text-muted-foreground text-sm', className)}
  data-slot="form-description"
  bind:ref
  {...restProps}
/>
