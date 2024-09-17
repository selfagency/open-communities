<svelte:options accessors />

<script lang="ts">
	/* region imports */
	import Contact from '$lib/components/global/contact.svelte';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let data: any;
	export let snapshot: any;
	/* endregion variables */
</script>

<svelte:head>
	<title>{$t('common.contact.contactUs')} &middot; {$t('common.title')}</title>
</svelte:head>

<section class="flex h-full w-full flex-col items-center justify-center" style="min-height: 50vh;">
	<Contact data={data.form} congregations={data.congregations} bind:snapshot />
</section>
