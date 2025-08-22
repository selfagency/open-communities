<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';

	import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<span
	bind:this={ref}
	aria-hidden="true"
	data-slot="pagination-ellipsis"
	class={cn('flex size-9 items-center justify-center', className)}
	{...restProps}
>
	<EllipsisIcon class="size-4" />
	<span class="sr-only">More pages</span>
</span>
