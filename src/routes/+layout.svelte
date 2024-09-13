<script>
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { onNavigate } from '$app/navigation';
	import Nav from '$lib/components/nav/index.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { initState, state } from '$lib/stores';

	import '../app.css';
	/* endregion imports */

	/* region lifecycle */
	onMount(() => {
		if (browser && isEmpty($state)) {
			initState();
		}
	});

	onNavigate((navigation) => {
		if (browser) {
			if (!document.startViewTransition) return;

			return new Promise((resolve) => {
				document.startViewTransition(async () => {
					resolve();
					await navigation.complete;
				});
			});
		}
	});
	/* endregion lifecycle */
</script>

<Nav />

<main class="container mx-auto mt-24 min-w-[360px] max-w-[960px]">
	<slot />
</main>

<Toaster />
