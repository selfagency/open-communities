<script lang="ts">
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	/* region imports */
	import LocationIcon from 'lucide-svelte/icons/globe';
	import SearchIcon from 'lucide-svelte/icons/search';
	import { fade } from 'svelte/transition';

	import type { CongregationMetaRecord, LocalesRecord } from '$lib/types';

	import { dev } from '$app/environment';
	import Locale from '$lib/components/congregation/locale.svelte';
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
	const locales = $results.map((c) => c.locale) as LocalesRecord[];

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
				class={`space-x-2 text-slate-500 ${$searchState.showLocale ? 'bg-slate-100' : ''}`}
				on:click={() => search.toggleLocale()}
			>
				<LocationIcon size="20" />
				<span>{$t('common.location')}</span>
			</Button>
			<Filters {search} />
		</div>
	</div>

	{#if $searchState.showLocale}
		<div class="flex flex-row items-center justify-center" transition:fade>
			<Locale {search} />
		</div>
	{/if}

	<div class="py-4">
		<Map {locales} {search} />
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
