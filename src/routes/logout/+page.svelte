<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import type { UsersRecord } from '$lib/types';

	import { goto } from '$app/navigation';
	import { user, initState } from '$lib/stores';
	/* endregion imports */

	/* region lifecycle */
	onMount(async () => {
		user.set({} as UsersRecord & { id: string; email: string });
		initState();
		await fetch('?/logout', { method: 'POST', body: new FormData() });
		await goto('/');
	});
	/* endregion lifecycle */
</script>
