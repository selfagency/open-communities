<script lang="ts">
	/* region imports */
	import Contact from '$lib/components/global/contact.svelte';
	import { t } from '$lib/i18n';

	import type { PageData, Snapshot } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const data: PageData = $props();

	// local vars
	let userData = $state('');
	/* endregion variables */

	export const snapshot: Snapshot<string> = {
		capture: () => userData,
		restore: (value) => (userData = value)
	};
</script>

<svelte:head>
	<title>{$t('common.contact.contactUs')} &middot; {$t('common.title')}</title>
</svelte:head>

<section class="flex h-full w-full flex-col items-center justify-center" style="min-height: 50vh;">
	<Contact data={data.form} congregations={data.congregations} bind:snapshot={userData} />
</section>
