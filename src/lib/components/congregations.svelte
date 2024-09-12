<script lang="ts">
	/* region imports */
	import type { CongregationMetaRecord } from '$lib/types';

	import Congregation from './congregation/index.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregations: CongregationMetaRecord & { id: string }[] = [];
	/* endregion variables */
</script>

<section class="grid w-full grid-cols-3 gap-4">
	{#each congregations as congregation}
		<div class="col-span-1">
			<Congregation {congregation} />
		</div>
	{/each}
</section>
