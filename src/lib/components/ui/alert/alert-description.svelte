<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils.js';

	type $$Props = HTMLAttributes<HTMLDivElement>;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<div class={cn('hyphens-auto text-sm [&_p]:leading-relaxed', className)} {...$$restProps}>
	<slot />
</div>
