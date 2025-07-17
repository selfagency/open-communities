<script lang="ts">
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import { Pagination as PaginationPrimitive } from "bits-ui";

	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: PaginationPrimitive.PrevButtonProps = $props();
</script>

{#snippet Fallback()}
	<ChevronLeftIcon class="size-4" />
	<span>Previous</span>
{/snippet}

<PaginationPrimitive.PrevButton
	bind:ref
	aria-label="Go to previous page"
	class={cn(
		buttonVariants({
			class: "gap-1 px-2.5 sm:pl-2.5",
			size: "default",
			variant: "ghost",
		}),
		className
	)}
	children={children || Fallback}
	{...restProps}
/>
