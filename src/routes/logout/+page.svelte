<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import type { UsersRecord } from '$lib/types';

	import { goto } from '$app/navigation';
	import { initState, user } from '$lib/stores';
	/* endregion imports */

	/* region lifecycle */
	onMount(async () => {
		user.set({} as UsersRecord & { email: string; id: string; });
		initState();
		await fetch('?/logout', { body: new FormData(), method: 'POST' });
		await goto('/');
	});
	/* endregion lifecycle */
</script>
