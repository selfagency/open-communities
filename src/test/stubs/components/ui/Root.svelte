<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	const open = writable(false);
	const toggle = () => open.update((v) => !v);
	setContext('TEST_SHEET', { open, toggle });
</script>

<div {...$$restProps}>
	<slot />
</div>
