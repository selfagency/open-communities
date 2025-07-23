<script lang="ts">
	/* region imports */
	import type { MapStore, ReadableAtom } from 'nanostores';

	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import ClearIcon from 'lucide-svelte/icons/circle-x';
	import LocationIcon from 'lucide-svelte/icons/globe';
	import SearchIcon from 'lucide-svelte/icons/search';
	import { alphabetical, isEmpty, sleep, unique } from 'radashi';
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';

	import type { CongregationMetaRecord } from '$lib/pocketbase.d';
	import type { LocationMeta, SearchData, SearchState } from '$lib/types.d';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CongregationCard from '$lib/components/congregation/congregation.svelte';
	import Loading from '$lib/components/global/loading.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Pagination from '$lib/components/ui/pagination';
	import { Location as LocationService } from '$lib/location';
	import * as m from '$lib/paraglide/messages';
	import { Search } from '$lib/search';
	import { state as appState } from '$lib/stores';

	import Filters from './filters.svelte';
	import Location from './location.svelte';
	import Map from './map.svelte';
	/* endregion imports */

	/* region types */
	type Congregation = CongregationMetaRecord & { id: string };
	/* endregion types */

	/* region variables */
	// constants
	const id = $derived(page.url.searchParams.get('id'));
	const search = new Search(page.data.congregations as SearchData[], dev);
	const {
		results,
		state: searchState
	}: { results: ReadableAtom<CongregationMetaRecord[]>; state: MapStore<SearchState> } = search;
	const location = new LocationService({ countries: page.data.countries, search: search });
	const open = {};

	// locals
	let loading = $state(true);
	let searchTerms = $state('');
	let currentPage = $state(1);
	let perPage = $state(12);
	// let reset: boolean = false;
	/* endregion variables */

	/* region methods */
	function onPageChange(pageNo: number) {
		currentPage = pageNo;
	}
	/*endregion methods */

	/* region reactivity */
	const locations = $derived.by(() => {
		const resultsValue = $results;
		if (resultsValue.length && resultsValue.length > 0) {
			const allLocations = resultsValue
				.filter((l) => {
					const location = l.location as LocationMeta;
					return [location.city?.name, location.state?.name, location.country?.name].every(
						(l) => !isEmpty(l)
					);
				})
				.map((l) => {
					const location = l.location as LocationMeta;
					return {
						city: location.city,
						country: location.country,
						latitude:
							location.city?.latitude || location.state?.latitude || location.country?.latitude,
						longitude:
							location.city?.longitude || location.state?.longitude || location.country?.longitude,
						state: location.state
					};
				}) as LocationMeta[];
			return unique(allLocations, (l) => l.city?.id as string);
		}
		return [];
	});

	const pages = $derived.by(() => {
		const result: Congregation[][] = [];
		const items = $results as Congregation[];
		if (items.length > 0) {
			for (let i = 0; i < items.length; i += perPage) {
				result.push(alphabetical(items, (i) => i.name as string).slice(i, i + perPage));
			}
		}
		return result;
	});

	onMount(async () => {
		await tick();
		await sleep(400);
		loading = false;
	});

	$effect(() => {
		if ($results) {
			currentPage = 1;
		}
	});

	$effect(() => {
		if (searchTerms) {
			search.setSearchTerms(searchTerms);
		}
	});

	$effect(() => {
		if (id) {
			goto(page.url.pathname, { replaceState: false }).then(() => {
				searchTerms = id;
				open[id] = true;
				searchTerms = '';
			});
		}
	});

	$effect(() => {
		if (currentPage) {
			pages[currentPage]?.reduce(
				(acc, congregation) => {
					acc[congregation.id] = false;
					return acc;
				},
				{} as Record<string, boolean>
			);
		}
	});
	/* endregion reactivity */
</script>

<section class="w-full space-y-4">
	{#if loading}
		<div class="flex w-full items-center justify-center">
			<Loading variant="full" />
		</div>
	{:else}
		<div
			class="flex w-full flex-col items-center justify-between space-y-4 space-x-0 sm:flex-row sm:space-y-0 sm:space-x-4 rtl:sm:space-x-0"
			transition:fade={{ delay: 300, duration: 300 }}
		>
			<div
				class="relative flex w-full min-w-max flex-row items-center justify-start space-x-2 text-slate-500"
			>
				<Label for="search" class="flex w-8 items-center justify-center">
					<SearchIcon size="20" />
					<span class="sr-only">{m.search()}</span>
				</Label>
				<span class="w-full">
					<Input placeholder={m.search()} bind:value={searchTerms} id="search" class="w-full" />

					<span class="absolute top-0 z-10 h-10 w-10 ltr:right-1 rtl:left-1 rtl:mx-1">
						<Button
							variant="link"
							class="text-slate-400 hover:text-slate-500"
							onclick={() => {
								searchTerms = '';
								search.setSearchTerms(searchTerms);
							}}
						>
							<ClearIcon size="16" />
							<span class="sr-only">{m.clear()}</span>
						</Button>
					</span>
				</span>
			</div>

			<div class="flex w-full flex-row items-center justify-end space-x-2 sm:w-auto">
				<Button
					variant="outline"
					class={`space-x-2 text-slate-500 rtl:mx-1 ${$searchState.showLocation ? 'bg-slate-100' : ''}`}
					onclick={() => {
						search.toggleLocation();
					}}
				>
					<LocationIcon size="20" class="rtl:mx-1" />
					<span>{m['location.location']()}</span>
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
					<span>{m.nothingFound()}</span>
				</div>
			{:else if pages?.length > 0}
				{#each pages[currentPage - 1] as congregation (congregation.id)}
					{#key congregation.id}
						<div class="col-span-1">
							<CongregationCard {congregation} open={open[congregation.id]} />
						</div>
					{/key}
				{/each}
			{/if}
		</div>

		<div class="flex w-full scale-90 flex-row items-center justify-center pt-4 sm:scale-100">
			<Pagination.Root
				count={$results?.length || 0}
				{perPage}
				{onPageChange}
				siblingCount={$appState.isMobile ? 0 : 1}
			>
				{#snippet children({ currentPage, pages })}
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
				{/snippet}
			</Pagination.Root>
		</div>
	{/if}
</section>
