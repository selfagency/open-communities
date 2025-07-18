<script lang="ts">
	/* region imports */
	import { setContext } from 'svelte';

	import EditForm from '$lib/components/form/form.svelte';
	import * as m from '$lib/paraglide/messages';

	import type { PageProps, Snapshot } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const { data }: PageProps = $props();
	let snapshotData = $state('');

	export const snapshot: Snapshot<string> = {
		capture: () => snapshotData,
		restore: (value) => (snapshotData = value)
	};
	/* endregion variables */

	/* region lifecycle */
	setContext('congregation', data.congregation);
	/* endregion lifecycle */
</script>

<svelte:head>
	<title>{m.editCongregation')} &middot; {$t('common.title}</title>
</svelte:head>

<EditForm data={data.form} mode="edit" bind:snapshot={snapshotData} />
