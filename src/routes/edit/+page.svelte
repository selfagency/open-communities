<svelte:options accessors />

<script lang="ts">
	/* region imports */
	import { setContext } from 'svelte';

	import EditForm from '$lib/components/form/form.svelte';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let data;
	export let snapshot;
	/* endregion variables */

	/* region lifecycle */
	setContext('congregation', data.congregation);
	/* endregion lifecycle */
</script>

<svelte:head>
	<title>{$t('congregation.editCongregation')} &middot; {$t('common.title')}</title>
</svelte:head>

<EditForm data={data.form} mode="edit" bind:snapshot />
