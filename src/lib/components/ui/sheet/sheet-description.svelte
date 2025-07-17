<script lang="ts">
	import { Dialog as SheetPrimitive } from "bits-ui";

	import { cn } from "$lib/utils.js";

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: SheetPrimitive.DescriptionProps = $props();
</script>

<SheetPrimitive.Description
	bind:ref
	data-slot="sheet-description"
	class={cn("text-muted-foreground text-sm", className)}
	{...restProps}
/>
