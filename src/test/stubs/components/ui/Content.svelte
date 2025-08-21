<script lang="ts">
	import { getContext, onDestroy } from 'svelte';

	type BoolStore = {
		subscribe: (fn: (v: boolean) => void) => () => void;
	};

	const ctx = getContext<{ open?: BoolStore }>('TEST_SHEET');

	// provide a safe default store when test context isn't provided
	const defaultOpen: BoolStore = {
		subscribe: (fn: (v: boolean) => void) => {
			fn(false);
			return () => {};
		}
	};

	const open: BoolStore =
		ctx?.open && typeof ctx.open.subscribe === 'function' ? ctx.open : defaultOpen;

	let visible = false;
	const unsub = open.subscribe((v: boolean) => (visible = v));
	onDestroy(() => {
		if (typeof unsub === 'function') unsub();
	});
</script>

{#if visible}
	<div {...$$restProps}>
		<slot />
	</div>
{/if}
