<script lang="ts">
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
	import { Search } from '$lib/stores';

	import Congregation from './congregation.svelte';
	import Filters from './filters.svelte';
	import Map from './map.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregations: (CongregationMetaRecord & { id: string })[] = [];

	// constants
	const locales = congregations.map((c) => c.locale) as LocalesRecord[];
	const search = new Search(dev);
	const { state: searchState } = search;

	// local vars
	let searchTerms = '';
	/* endregion variables */
</script>

<section class="w-full space-y-4">
	<div class="flex w-full flex-row items-center justify-between space-x-2">
		<div class="flex w-full min-w-max flex-row items-center justify-start space-x-2 text-slate-500">
			<SearchIcon size="20" />
			<Input
				placeholder={$t('base.common.search')}
				bind:value={searchTerms}
				on:keyup={() => search.setSearchTerms(searchTerms)}
			/>
		</div>

		<div class="flex flex-row items-center justify-end space-x-2">
			<Button
				variant="outline"
				class={`space-x-2 text-slate-500 ${$searchState.showLocale ? 'bg-slate-100' : ''}`}
				on:click={() => search.toggleLocale()}
			>
				<LocationIcon size="20" />
				<span>{$t('base.common.location')}</span>
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

	<div class="grid w-full grid-cols-3 gap-4">
		{#each congregations as congregation}
			<div class="col-span-1">
				<Congregation {congregation} />
			</div>
		{/each}
	</div>
</section>
