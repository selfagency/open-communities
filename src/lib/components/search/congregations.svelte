<script lang="ts">
	/* region imports */
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import ClearIcon from 'lucide-svelte/icons/circle-x';
	import LocationIcon from 'lucide-svelte/icons/globe';
	import SearchIcon from 'lucide-svelte/icons/search';
	import { isEmpty, alphabetical } from 'radashi';
	import { fade } from 'svelte/transition';

	import type { LocationMeta } from '$lib/location';
	import type { CongregationMetaRecord } from '$lib/types';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Congregation from '$lib/components/congregation/congregation.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Pagination from '$lib/components/ui/pagination';
	import { t } from '$lib/i18n';
	import { Location as LocationService } from '$lib/location';
	import { Search } from '$lib/search';
	import { state } from '$lib/stores';

	import Filters from './filters.svelte';
	import Location from './location.svelte';
	import Map from './map.svelte';
	/* endregion imports */

	/* region types */
	type Congregation = CongregationMetaRecord & { id: string };
	/* endregion types */

	/* region variables */
	// props
	export let congregations: Congregation[] = [];

	// constants
	const search = new Search(congregations, dev);
	const { state: searchState, results } = search;
	const location = new LocationService(search);
	const open = {};

	// local vars
	let searchTerms = '';
	let locations: LocationMeta[] = [];
	let currentPage = 1;
	let perPage = 12;
	let pages: Congregation[][] = [];
	// let reset: boolean = false;
	/* endregion variables */

	/* region methods */
	function paginate(items: Congregation[]) {
		const result: Congregation[][] = [];
		for (let i = 0; i < items.length; i += perPage) {
			result.push(alphabetical(items, (i) => i.name as string).slice(i, i + perPage));
		}
		return result;
	}

	function onPageChange(pageNo: number) {
		currentPage = pageNo;
	}
	/*endregion methods */

	/* region reactivity */
	results.subscribe((value) => {
		if (value.length > 0) {
			locations = value
				.filter((l) =>
					[l.location.city.name, l.location.state.name, l.location.country.name].every(
						(l) => !isEmpty(l)
					)
				)
				.map((l) => ({
					city: l.location.city,
					state: l.location.state,
					country: l.location.country,
					latitude:
						l.location.city?.latitude || l.location.state?.latitude || l.location.country?.latitude,
					longitude:
						l.location.city?.longitude ||
						l.location.state?.longitude ||
						l.location.country?.longitude
				})) as LocationMeta[];

			currentPage = 1;
			pages = paginate(value as Congregation[]);
		}
	});

	$: if (searchTerms) {
		search.setSearchTerms(searchTerms);
	}

	$: if ($page.url.searchParams.has('id')) {
		const id = $page.url.searchParams.get('id') || '';
		goto($page.url.pathname, { replaceState: false }).then(() => {
			searchTerms = id;
			open[id] = true;
			searchTerms = '';
		});
	}

	$: if (currentPage) {
		pages[currentPage]?.reduce(
			(acc, congregation) => {
				acc[congregation.id] = false;
				return acc;
			},
			{} as Record<string, boolean>
		);
	}
	/* endregion reactivity */
</script>

<section class="w-full space-y-4">
	<div
		class="flex w-full flex-col items-center justify-between space-x-0 space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
	>
		<div
			class="relative flex w-full min-w-max flex-row items-center justify-start space-x-2 text-slate-500"
		>
			<Label for="search">
				<SearchIcon size="20" />
				<span class="sr-only">{$t('common.search')}</span>
			</Label>
			<span class="w-full">
				<Input
					placeholder={$t('common.search')}
					bind:value={searchTerms}
					id="search"
					class="w-full"
				/>

				<span class="absolute right-1 top-0 z-10 h-10 w-10">
					<Button
						variant="link"
						class="text-slate-400 hover:text-slate-500"
						on:click={() => {
							searchTerms = '';
							search.setSearchTerms(searchTerms);
						}}
					>
						<ClearIcon size="16" />
						<span class="sr-only">{$t('common.clear')}</span>
					</Button>
				</span>
			</span>
		</div>

		<div class="flex w-full flex-row items-center justify-end space-x-2 sm:w-auto">
			<Button
				variant="outline"
				class={`space-x-2 text-slate-500 ${$searchState.showLocation ? 'bg-slate-100' : ''}`}
				on:click={() => {
					search.toggleLocation();
				}}
			>
				<LocationIcon size="20" />
				<span>{$t('common.location')}</span>
			</Button>
			<Filters {search} />
		</div>
	</div>

	{#if $searchState?.showLocation}
		<div class="flex flex-row items-center justify-center" transition:fade>
			<Location {location} {search} />
		</div>
	{/if}

	<div class="py-4">
		<Map {location} {locations} {search} />
	</div>

	<div class="grid w-full auto-cols-fr grid-cols-1 gap-4 sm:grid-cols-3">
		{#if $results?.length === 0}
			<div
				class="col-span-3 flex flex-row items-center justify-center space-x-2 py-12 text-slate-500"
			>
				<WarningIcon size="20" />
				<span>{$t('congregation.nothingFound')}</span>
			</div>
		{:else if pages?.length > 0}
			{#each pages[currentPage - 1] as congregation}
				{#key congregation.id}
					<div class="col-span-1">
						<Congregation {congregation} open={open[congregation.id]} />
					</div>
				{/key}
			{/each}
		{/if}
	</div>

	<div class="flex w-full scale-90 flex-row items-center justify-center pt-4 sm:scale-100">
		<Pagination.Root
			count={$results?.length || 0}
			{perPage}
			let:pages
			let:currentPage
			{onPageChange}
			siblingCount={$state.isMobile ? 0 : 1}
		>
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.PrevButton />
				</Pagination.Item>
				{#each pages as page (page.key)}
					{#if page.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item>
							<Pagination.Link {page} isActive={currentPage == page.value}>
								{page.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item>
					<Pagination.NextButton />
				</Pagination.Item>
			</Pagination.Content>
		</Pagination.Root>
	</div>
</section>
