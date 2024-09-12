<script lang="ts">
	/* region imports */
	import type { CongregationMetaRecord } from '$lib/types';

	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';

	import Congregation from './congregation.svelte';
	import Filters from './filters.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregations: CongregationMetaRecord & { id: string }[] = [];
	/* endregion variables */
</script>

<section class="w-full">
	<div class="mx-auto mb-6 flex w-1/2 flex-row items-center justify-center space-x-2">
		<Input placeholder={$t('base.common.search')} />
	</div>

	<Filters />

	<div class="grid w-full grid-cols-3 gap-4">
		{#each congregations as congregation}
			<div class="col-span-1">
				<Congregation {congregation} />
			</div>
		{/each}
	</div>
</section>
