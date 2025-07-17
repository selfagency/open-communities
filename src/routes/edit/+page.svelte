<script lang="ts">
	/* region imports */
	import { setContext } from 'svelte';

	import EditForm from '$lib/components/form/form.svelte';
	import { t } from '$lib/i18n';

	import type { Snapshot } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const data = $props();
	let userData = $state('');

	export const snapshot: Snapshot<string> = {
		capture: () => userData,
		restore: (value) => (userData = value)
	};
	/* endregion variables */

	/* region lifecycle */
	setContext('congregation', data.congregation);
	/* endregion lifecycle */
</script>

<svelte:head>
	<title>{$t('congregation.editCongregation')} &middot; {$t('common.title')}</title>
</svelte:head>

<EditForm data={data.form} mode="edit" bind:snapshot={userData} />
