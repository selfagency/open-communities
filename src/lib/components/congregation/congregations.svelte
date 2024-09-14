<script lang="ts">
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	/* region imports */
	import LocationIcon from 'lucide-svelte/icons/globe';
	import SearchIcon from 'lucide-svelte/icons/search';
	import { fade } from 'svelte/transition';

	import type { LocationRecord } from '$lib/location';
	import type { CongregationMetaRecord } from '$lib/types';

	import { dev } from '$app/environment';
	import Location from '$lib/components/congregation/location.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { Search } from '$lib/search';

	import Congregation from './congregation.svelte';
	import Filters from './filters.svelte';
	import Map from './map.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregations: (CongregationMetaRecord & { id: string })[] = [];

	// constants
	const search = new Search(congregations, dev);
	const { state: searchState, results } = search;
	const locations = $results.map((c) => ({
		city: c.location.city?.name,
		state: c.location.state?.name,
		country: c.location.country?.name,
		latitude:
			c.location.city?.latitude || c.location.state?.latitude || c.location.country?.latitude,
		longitude:
			c.location.city?.longitude || c.location.state?.longitude || c.location.country?.longitude
	})) as LocationRecord[];

	// local vars
	let searchTerms = '';
	/* endregion variables */
</script>

<section class="w-full space-y-4">
	<div
		class="flex w-full flex-col items-center justify-between space-x-0 space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
	>
		<div class="flex w-full min-w-max flex-row items-center justify-start space-x-2 text-slate-500">
			<SearchIcon size="20" />
			<Input
				placeholder={$t('common.search')}
				bind:value={searchTerms}
				on:keyup={() => search.setSearchTerms(searchTerms)}
			/>
		</div>

		<div class="flex w-full flex-row items-center justify-end space-x-2 sm:w-auto">
			<Button
				variant="outline"
				class={`space-x-2 text-slate-500 ${$searchState.showLocation ? 'bg-slate-100' : ''}`}
				on:click={() => search.toggleLocation()}
			>
				<LocationIcon size="20" />
				<span>{$t('common.location')}</span>
			</Button>
			<Filters {search} />
		</div>
	</div>

	{#if $searchState.showLocation}
		<div class="flex flex-row items-center justify-center" transition:fade>
			<Location {search} />
		</div>
	{/if}

	<div class="py-4">
		<Map {locations} {search} />
	</div>

	<div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
		{#if $results.length === 0}
			<div
				class="col-span-3 flex flex-row items-center justify-center space-x-2 py-12 text-slate-500"
			>
				<WarningIcon size="20" />
				<span>{$t('congregation.nothingFound')}</span>
			</div>
		{:else}
			{#each $results as congregation}
				<div class="col-span-1">
					<Congregation {congregation} />
				</div>
			{/each}
		{/if}
	</div>
</section>
