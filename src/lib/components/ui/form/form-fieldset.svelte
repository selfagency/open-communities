<script lang="ts" generics="T extends Record<string, unknown>, U extends FormPath<T>">

  import * as FormPrimitive from 'formsnap';
  import type { FormPath } from 'sveltekit-superforms';

  import { cn, type WithoutChild } from '$lib/utils.js';

  let {
    class: className,
    form,
    name,
    ref = $bindable(null),
    ...restProps
  }: WithoutChild<FormPrimitive.FieldsetProps<T, U>> = $props();
</script>

<FormPrimitive.Fieldset bind:ref {form} {name} class={cn('space-y-2', className)} {...restProps} />
