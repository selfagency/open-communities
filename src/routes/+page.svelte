<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import type { CongregationMetaRecord } from '$lib/types';

	import Congregations from '$lib/components/congregations.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data;

	// local vars
	let congregations: CongregationMetaRecord & { id: string }[];
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		if (data.congregations) {
			congregations = data.congregations;
		}
	});
</script>

{#if congregations}
	<Congregations {congregations} />
{/if}
