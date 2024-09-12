<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import type { UsersRecord } from '$lib/types';

	import { goto } from '$app/navigation';
	import { user } from '$lib/stores';
	/* endregion imports */

	/* region lifecycle */
	onMount(async () => {
		user.set({} as UsersRecord & { email: string });
		await fetch('?/logout', { method: 'POST' });
		await goto('/');
	});
	/* endregion lifecycle */
</script>
