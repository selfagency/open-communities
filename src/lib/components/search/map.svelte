<script lang="ts">
/* region imports */
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { mode } from 'mode-watcher';
import { DefaultMarker, type LngLatLike, MapLibre, Popup } from 'svelte-maplibre';
import { Button } from '$lib/components/ui/button';
import type { Location } from '$lib/location';
import { darkStyle, lightStyle } from '$lib/map-styles';
import { m } from '$lib/paraglide/messages';
import type { Search } from '$lib/search';
import type { LocationMeta } from '$lib/types.d';

/* endregion imports */

// maplibre-gl v6 requires a one-time setWorkerUrl() call in bundlers (Vite/Rolldown)
// so the worker file resolves correctly; without it the worker 404s.
setWorkerUrl(workerUrl);

/* region variables */
// props
let {
  location,
  locations = $bindable([] as LocationMeta[]),
  search
}: {
  location: Location;
  locations: LocationMeta[];
  search: Search;
} = $props();

// constants
// svelte-ignore state_referenced_locally
const { state: searchState } = search;

// locals
const center = $derived.by(() => {
  const loc = $searchState.searchLocation;
  if (loc?.country?.id) {
    return [
      loc.city?.longitude || loc.state?.longitude || loc.country?.longitude || -90,
      loc.city?.latitude || loc.state?.latitude || loc.country?.latitude || 10
    ] as LngLatLike;
  }
  return [-90, 10] as LngLatLike;
});

const mapStyle = $derived(mode.current === 'dark' ? darkStyle : lightStyle);

const zoom = $derived.by(() => {
  const loc = $searchState.searchLocation;
  if (loc?.country?.id) {
    if (loc.city?.id) {
      return 10;
    }
    if (loc.state?.id) {
      return 6;
    }
    return 3;
  }
  return 1;
});

// Only markers with real coordinates can project onto the map. Skip the rest so
// maplibre never tries to place a marker at [0, 0] or with an undefined lngLat.
const markerLocations = $derived(
  locations.filter(
    (l): l is LocationMeta & { latitude: number; longitude: number } =>
      typeof l.latitude === 'number' && typeof l.longitude === 'number'
  )
);
/* endregion variables */
</script>

{#if (globalThis as any).__TEST__}
  <!-- Test-friendly fallback: render buttons for each location so tests can query labels
		 without initializing MapLibre / WebGL. -->
  <div class="h-96">
    {#each locations as { city, country, state }, i (city?.id ?? `${country?.id ?? ''}-${state?.id ?? ''}-${i}`)}
      <div>
        <Button
          class="h-full min-h-max w-full"
          onclick={() => {
            search.store.showLocation = true;
            location.load({ city: city?.id, country: country?.id, state: state?.id });
          }}
          variant="ghost"
        >
          <span class="text-xs">
            {#if city}
              {city.name},
            {/if}
            {#if state}
              {state.name},
            {/if}
            {#if country}
              {country.name}
            {/if}
          </span>
        </Button>
      </div>
    {/each}
  </div>
{:else}
  <div aria-label={m.congregationMap()} role="region">
    <MapLibre {center} class="h-96" minZoom={1} standardControls style={mapStyle} {zoom}>
      {#snippet children({ loaded })}
        <!-- Wait for the map load event so its transform is ready before markers project. -->
        {#if loaded}
          {#each markerLocations as { city, country, latitude, longitude, state }, i (city?.id ?? `${country?.id ?? ''}-${state?.id ?? ''}-${i}`)}
            <DefaultMarker lngLat={[longitude, latitude]}>
              <Popup offset={[0, -10]}>
                <button
                  class="text-foreground underline-offset-4 hover:underline text-sm cursor-pointer"
                  onclick={async () => {
                  search.store.showLocation = true;
                  await location.load({
                    city: city?.id,
                    country: country?.id,
                    state: state?.id
                  });
                  const loc = location.state.get();
                  search.setSearchLocation(loc.record);
                }}
                >
                  {#if city}
                    {city.name},
                  {/if}
                  {#if state}
                    {state.name},
                  {/if}
                  {#if country}
                    {country.name}
                  {/if}
                </button>
              </Popup>
            </DefaultMarker>
          {/each}
        {/if}
      {/snippet}
    </MapLibre>
  </div>
{/if}
