<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import type { CongregationMetaRecord, PagesRecord } from '$lib/types';

	import Congregations from '$lib/components/congregations.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data;

	// local vars
	let congregations: CongregationMetaRecord & { id: string }[];
	let content: PagesRecord;
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		if (data) {
			congregations = data.congregations;
			content = data.page;
		}
	});
</script>

<section class="prose mx-auto mb-12">
	{@html content?.content}
</section>

{#if congregations}
	<Congregations {congregations} />
{/if}
