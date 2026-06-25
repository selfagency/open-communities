<script generics="T extends Record<string, unknown>, U extends FormPathLeaves<T>" lang="ts">
import * as FormPrimitive from 'formsnap';
import type { HTMLAttributes } from 'svelte/elements';
import type { FormPathLeaves } from 'sveltekit-superforms';

import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js';

let {
  children: childrenProp,
  class: className,
  form,
  name,
  ref = $bindable(null),
  ...restProps
}: FormPrimitive.ElementFieldProps<T, U> & WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<FormPrimitive.ElementField {form} {name}>
  {#snippet children({ constraints, errors, tainted, value })}
    <div class={cn('space-y-2', className)} bind:this={ref} {...restProps}>
      {@render childrenProp?.({ constraints, errors, tainted, value })}
    </div>
  {/snippet}
</FormPrimitive.ElementField>
