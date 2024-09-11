<script lang="ts">
	/* region imports */
	import type { CongregationMetaRecord } from '$lib/types';

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n';

	import Congregation from './congregation/index.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregations: CongregationMetaRecord[] = [];
	/* endregion variables */
</script>

<div class="mb-4 flex flex-row items-center justify-end">
	<Button on:click={async () => await goto('/add')}>
		{$t('base.congregation.add')}
	</Button>
</div>

<section class="grid w-full grid-cols-4 gap-4">
	{#each congregations as congregation}
		<div class="col-span-1">
			<Congregation {congregation} />
		</div>
	{/each}
</section>
