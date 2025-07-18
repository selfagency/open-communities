<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { initState } from '$lib/stores';
	/* endregion imports */

	/* region lifecycle */
	onMount(async () => {
		initState();
		await fetch('?/logout', { body: new FormData(), method: 'POST' });
		await goto('/');
	});
	/* endregion lifecycle */
</script>
