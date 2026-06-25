<script lang="ts">
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as FormPrimitive from 'formsnap';

import { cn, type WithoutChild } from '$lib/utils.js';

let {
  children: childrenProp,
  class: className,
  errorClasses,
  ref = $bindable(null),
  ...restProps
}: WithoutChild<FormPrimitive.FieldErrorsProps> & {
  errorClasses?: null | string | undefined;
} = $props();
</script>

<FormPrimitive.FieldErrors class={cn('text-destructive text-sm font-medium', className)} bind:ref {...restProps}>
  {#snippet children({ errorProps, errors })}
    {#if childrenProp}
      {@render childrenProp({ errorProps, errors })}
    {:else}
      {#each errors as err (err)}
        <div {...errorProps} class={cn(errorClasses)}>{err}</div>
      {/each}
    {/if}
  {/snippet}
</FormPrimitive.FieldErrors>
