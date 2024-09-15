<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	type $$Props = HTMLAttributes<HTMLDivElement>;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<div
	class={cn(
		'items-left flex flex-col justify-between rounded-lg border bg-card text-card-foreground shadow-sm',
		className
	)}
	{...$$restProps}
>
	<slot />
</div>
