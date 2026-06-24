<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card-footer"
	class={cn("px-4 py-2 group-data-[size=sm]/card:px-3 group-data-[size=sm]/card:py-1.5 flex items-center", className)}
	{...restProps}
>
	{@render children?.()}
</div>
