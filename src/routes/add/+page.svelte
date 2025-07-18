<script lang="ts">
	/* region imports */
	import AddForm from '$lib/components/form/form.svelte';
	import * as m from '$lib/paraglide/messages';

	import type { PageProps, Snapshot } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const { data }: PageProps = $props();

	// local vars
	let snapshotData = $state('');
	/* endregion variables */

	export const snapshot: Snapshot<string> = {
		capture: () => snapshotData,
		restore: (value) => (snapshotData = value)
	};
</script>

<svelte:head>
	<title>{m.addCongregation')} &middot; {$t('common.title}</title>
</svelte:head>

<AddForm data={data.form} content={data.content} bind:snapshot={snapshotData} />
