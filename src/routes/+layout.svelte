<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	// import { pwaAssetsHead } from 'virtual:pwa-assets/head';
	// import { pwaInfo } from 'virtual:pwa-info';
	// import { registerSW } from 'virtual:pwa-register';

	import { browser } from '$app/environment';
	import { onNavigate } from '$app/navigation';
	import Footer from '$lib/components/global/footer.svelte';
	import Header from '$lib/components/global/header.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { t } from '$lib/i18n';
	import { setState, state, initState } from '$lib/stores';
	// import { log } from '$lib/utils';

	import '../app.css';
	/* endregion imports */

	/* region variables */
	// local vars
	let innerWidth = 0;
	let innerHeight = 0;
	/* endregion variables */

	/* region lifecycle */
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

	/* region reactivity */
	$: if (browser && isEmpty($state)) {
		initState();
	}

	$: if (innerWidth > 0) {
		setState({ offsetWidth: innerWidth, isMobile: innerWidth < 640 });
	}

	$: if (innerHeight > 0) {
		setState({ offsetHeight: innerHeight });
	}
	/* endregion reactivity */
</script>

<svelte:window bind:innerWidth bind:innerHeight />
<svelte:head>
	<title>{$t('common.title')}</title>
</svelte:head>

<div class="flex h-full min-h-screen flex-col items-center justify-between">
	<Header />
	<main class="container mx-auto mt-24 min-w-[300px] max-w-[1024px]">
		<slot />
	</main>
	<Footer />
</div>

<Toaster />
