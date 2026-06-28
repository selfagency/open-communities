<script generics="T extends Record<string, unknown>, U extends FormPath<T>" lang="ts">
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as FormPrimitive from 'formsnap';
import type { HTMLAttributes } from 'svelte/elements';
import type { FormPath } from 'sveltekit-superforms';

import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js';

let {
  children: childrenProp,
  class: className,
  form,
  name,
  ref = $bindable(null),
  ...restProps
}: FormPrimitive.FieldProps<T, U> & WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<FormPrimitive.Field {form} {name}>
  {#snippet children({ constraints, errors, tainted, value })}
    <div class={cn('space-y-2', className)} data-slot="form-item" bind:this={ref} {...restProps}>
      {@render childrenProp?.({ constraints, errors, tainted, value })}
    </div>
  {/snippet}
</FormPrimitive.Field>
