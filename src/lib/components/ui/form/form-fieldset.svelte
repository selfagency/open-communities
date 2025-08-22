<script lang="ts" generics="T extends Record<string, unknown>, U extends FormPath<T>">
	import type { FormPath } from 'sveltekit-superforms';

	import * as FormPrimitive from 'formsnap';

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
