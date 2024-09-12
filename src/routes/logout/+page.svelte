<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import type { UsersRecord } from '$lib/types';

	import { goto } from '$app/navigation';
	import { state, user, type State } from '$lib/stores';
	/* endregion imports */

	/* region lifecycle */
	onMount(async () => {
		user.set({} as UsersRecord & { email: string });
		state.set({} as State);
		await fetch('?/logout', { method: 'POST', body: new FormData() });
		await goto('/');
	});
	/* endregion lifecycle */
</script>
