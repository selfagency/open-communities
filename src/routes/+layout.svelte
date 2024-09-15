<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { pwaAssetsHead } from 'virtual:pwa-assets/head';
	import { pwaInfo } from 'virtual:pwa-info';
	import { registerSW } from 'virtual:pwa-register';

	import { browser, dev } from '$app/environment';
	import { onNavigate } from '$app/navigation';
	import Footer from '$lib/components/global/footer.svelte';
	import Header from '$lib/components/global/header.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { initState, setState, state } from '$lib/stores';
	import { log } from '$lib/utils';

	import '../app.css';
	/* endregion imports */

	/* region variables */
	// local vars
	let innerWidth = 0;
	let innerHeight = 0;
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		if (browser && isEmpty($state)) {
			if ('serviceWorker' in navigator && pwaInfo) {
				const updateSw = registerSW({
					immediate: false,
					onRegistered(r) {
						if (r) {
							setInterval(() => {
								r.update();
							}, 60 * 1000);
						}
					},
					onRegisterError(error) {
						log.error('ServiceWorker registration error:', error);
					},
					async onNeedRefresh() {
						await updateSw();
					}
				});
			} else {
				if (dev) log.warn('ServiceWorker not available');
			}

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

	/* region reactivity */
	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

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
	{@html webManifestLink}
	{#if pwaAssetsHead.themeColor}
		<meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
	{/if}
	{#each pwaAssetsHead.links as link}
		<link {...link} />
	{/each}
</svelte:head>

<div class="flex h-full min-h-screen flex-col items-center justify-between">
	<Header />
	<main class="container mx-auto mt-24 min-w-[420px] max-w-[1024px]">
		<slot />
	</main>
	<Footer />
</div>

<Toaster />
