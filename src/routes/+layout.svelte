<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	/* region imports */
	import { browser } from '$app/environment';
	import { onNavigate } from '$app/navigation';
	import Footer from '$lib/components/global/footer.svelte';
	import Header from '$lib/components/global/header.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { t } from '$lib/i18n';
	import { setState, user } from '$lib/stores';

	// import { log } from '$lib/utils';
	import '../app.css';

	/* endregion imports */
	/* region variables */
	// locals
	let innerWidth = 0;
	let innerHeight = 0;

	/* endregion variables */
	/* region lifecycle */
	onMount(() => {
		if (browser) {
			if ($user?.lang === 'he') {
				document.body.setAttribute('dir', 'rtl');
			} else {
				document.body.setAttribute('dir', 'ltr');
			}
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
	$: if (innerWidth > 0) {
		setState({
			isMobile: innerWidth < 640,
			offsetWidth: innerWidth
		});
	}

	$: if (innerHeight > 0) {
		setState({ offsetHeight: innerHeight });
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />
<svelte:head>
	<title>{$t('common.title')}</title>
</svelte:head>

<div class="flex h-full min-h-screen flex-col items-center justify-between">
	<Header />
	<main class="container mx-auto mt-24 max-w-[1024px] min-w-[300px]">
		<slot />
	</main>
	<Footer />
</div>

<Toaster />
