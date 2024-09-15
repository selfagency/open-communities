<script lang="ts">
	/* region imports */
	import { unique, isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { MapLibre, DefaultMarker, Popup, type LngLatLike } from 'svelte-maplibre';

	import type { LocationMeta } from '$lib/location';

	import { Button } from '$lib/components/ui/button';
	import { Search } from '$lib/search';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let locations: LocationMeta[] = [];
	export let search: Search;

	// constants
	const { state: searchState } = search;

	// local vars
	let center: LngLatLike = [0, 10];
	let zoom = 1;
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		searchState.subscribe((value) => {
			if (!isEmpty(value.searchLocation)) {
				if (!isEmpty(value.searchLocation?.country)) {
					if (
						!isEmpty(value.searchLocation?.longitude) &&
						!isEmpty(value.searchLocation?.latitude)
					) {
						center = [
							value.searchLocation?.longitude,
							value.searchLocation?.latitude
						] as LngLatLike;
					} else {
						center = [0, 10];
					}

					zoom = 3;

					if (!isEmpty(value.searchLocation?.state)) {
						zoom = 6;
					}

					if (!isEmpty(value.searchLocation?.city)) {
						zoom = 10;
					}
				} else {
					zoom = 1;
				}
			} else {
				center = [0, 10];
				zoom = 1;
			}
		});
	});
</script>

<MapLibre
	{center}
	{zoom}
	class="h-96"
	standardControls
	style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
	attributionControl={false}
>
	{#each unique(locations) as { city, state, country, longitude, latitude }}
		<DefaultMarker lngLat={[longitude || 0, latitude || 0]}>
			<Popup offset={[0, -10]}>
				<Button
					variant="link"
					class="h-auto p-0"
					on:click={() => {
						searchState.set({
							...searchState.get(),
							searchLocation: {
								city,
								state,
								country
							}
						});
					}}
				>
					{#if city}{city.name},{/if}
					{#if state}{state.name},{/if}
					{#if country}{country.name}{/if}
				</Button>
			</Popup>
		</DefaultMarker>
	{/each}
</MapLibre>
