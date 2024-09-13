<script lang="ts">
	/* region imports */
	import { unique } from 'radashi';
	import { MapLibre, DefaultMarker, Popup, type LngLatLike } from 'svelte-maplibre';

	import type { LocalesRecord } from '$lib/types';

	import { state } from '$lib/stores';
	/* endregion imports */

	/* region variables */
	// props
	export let locales: LocalesRecord[] = [];

	// local vars
	let center: LngLatLike = [0, 10];
	let zoom = 1;
	/* endregion variables */

	/* region reactivity */
	$: if ($state.searchLocale?.longitude && $state.searchLocale?.latitude) {
		center = [$state.searchLocale.longitude, $state.searchLocale.latitude] as LngLatLike;
		zoom = 5;
	}
	/* endregion reactivity */
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
			<Popup offset={[0, -10]}>
				<div class="text-lg font-bold">{city}, {state}</div>
			</Popup>
		</DefaultMarker>
	{/each}
</MapLibre>
