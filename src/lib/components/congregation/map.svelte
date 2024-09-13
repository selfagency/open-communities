<script lang="ts">
	/* region imports */
	import { unique, isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { MapLibre, DefaultMarker, Popup, type LngLatLike } from 'svelte-maplibre';

	import type { LocalesRecord } from '$lib/types';

	import { Search } from '$lib/search';
	// import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let locales: LocalesRecord[] = [];
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
			if (!isEmpty(value.searchLocale)) {
				if (!isEmpty(value.searchLocale?.country)) {
					if (!isEmpty(value.searchLocale?.longitude) && !isEmpty(value.searchLocale?.latitude)) {
						center = [value.searchLocale?.longitude, value.searchLocale?.latitude] as LngLatLike;
					} else {
						center = [0, 10];
					}

					zoom = 3;

					if (!isEmpty(value.searchLocale?.state)) {
						zoom = 6;
					}

					if (!isEmpty(value.searchLocale?.city)) {
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
>
	{#each unique(locales) as { latitude, longitude, city, state }}
		<DefaultMarker lngLat={[longitude || 0, latitude || 0]}>
			<Popup offset={[0, -10]} on:click={() => {}}>
				<div class="font-sans">{city}, {state}</div>
			</Popup>
		</DefaultMarker>
	{/each}
</MapLibre>
