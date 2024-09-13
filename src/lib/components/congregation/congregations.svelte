<script lang="ts">
	/* region imports */
	import Search from 'lucide-svelte/icons/search';

	import type { CongregationMetaRecord, LocalesRecord } from '$lib/types';

	import Locale from '$lib/components/congregation/locale.svelte';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { setState } from '$lib/stores';

	import Congregation from './congregation.svelte';
	import Filters from './filters.svelte';
	import Map from './map.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregations: (CongregationMetaRecord & { id: string })[] = [];

	// constants
	const locales = congregations.map((c) => c.locale) as LocalesRecord[];

	// local vars
	let searchTerms = '';
	/* endregion variables */
</script>

<section class="w-full space-y-4">
	<div class="flex flex-row items-center justify-between w-full space-x-2">
		<div class="flex flex-row items-center justify-start w-full space-x-2 min-w-max">
			<Search size="20" color="gray" />
			<Input
				placeholder={$t('base.common.search')}
				bind:value={searchTerms}
				on:keyup={() => setState({ searchTerms })}
			/>
		</div>

		<div class="flex flex-row items-center justify-end">
			<Filters />
		</div>
	</div>

	<div class="flex flex-row items-center justify-center">
		<Locale />
	</div>

	<Map {locales} />

	<div class="grid w-full grid-cols-3 gap-4">
		{#each congregations as congregation}
			<div class="col-span-1">
				<Congregation {congregation} />
			</div>
		{/each}
	</div>
</section>
