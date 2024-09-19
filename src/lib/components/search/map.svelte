<script lang="ts">
	/* region imports */
	import { unique } from 'radashi';
	import { onMount } from 'svelte';
	import { MapLibre, DefaultMarker, Popup, type LngLatLike } from 'svelte-maplibre';

	import type { LocationMeta } from '$lib/location';

	import { Button } from '$lib/components/ui/button';
	import { Location } from '$lib/location';
	import { Search } from '$lib/search';
	// import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let location: Location;
	export let locations: LocationMeta[] = [];
	export let search: Search;

	// constants
	const { state: searchState } = search;

	// local vars
	let center: LngLatLike = [-90, 10];
	let zoom = 1;
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		searchState.subscribe((value) => {
			if (value.searchLocation?.country?.id) {
				center = [
					value.searchLocation?.city?.longitude ||
						value.searchLocation?.state?.longitude ||
						value.searchLocation?.country?.longitude ||
						-90,
					value.searchLocation?.city?.latitude ||
						value.searchLocation?.state?.latitude ||
						value.searchLocation?.country?.latitude ||
						10
				] as LngLatLike;

				zoom = 3;
				if (value.searchLocation?.state?.id) zoom = 6;
				if (value.searchLocation?.city?.id) zoom = 10;
			} else {
				center = [-90, 10];
				zoom = 1;
			}
		});
	});
	/* endregion lifecycle */

	/* region reactivity */
	$: locations = unique(locations, (l) => l.city?.id as string);
	/* endregion reactivity */
</script>

<MapLibre
	{center}
	{zoom}
	class="h-96"
	standardControls
	style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
	attributionControl={false}
>
	{#each locations as { city, state, country, longitude, latitude }}
		<DefaultMarker lngLat={[longitude || 0, latitude || 0]}>
			<Popup offset={[0, -10]}>
				<Button
					variant="ghost"
					class="h-full min-h-max w-full"
					on:click={() => {
						searchState.set({
							...searchState.get(),
							showLocation: true
						});
						location.load({
							city: city?.id,
							state: state?.id,
							country: country?.id
						});
					}}
				>
					<span class="text-xs">
						{#if city}{city.name},{/if}
						{#if state}{state.name},{/if}
						{#if country}{country.name}{/if}
					</span>
				</Button>
			</Popup>
		</DefaultMarker>
	{/each}
</MapLibre>
