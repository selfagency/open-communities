<script lang="ts">
  import { mode } from 'mode-watcher';
  /* region imports */
  import { DefaultMarker, type LngLatLike, MapLibre, Popup } from 'svelte-maplibre';
  import { Button } from '$lib/components/ui/button';
  import type { Location } from '$lib/location';
  import type { Search } from '$lib/search';
  import type { LocationMeta } from '$lib/types.d';

  /* endregion imports */

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

  const mapStyle = $derived(
    mode.current === 'dark'
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
  );

  const zoom = $derived.by(() => {
    const loc = $searchState.searchLocation;
    if (loc?.country?.id) {
      if (loc.city?.id) return 10;
      if (loc.state?.id) return 6;
      return 3;
    }
    return 1;
  });
  /* endregion variables */
</script>

{#if globalThis.__TEST__}
  <!-- Test-friendly fallback: render buttons for each location so tests can query labels
		 without initializing MapLibre / WebGL. -->
  <div class="h-96">
    {#each locations as { city, country, state } (city?.id)}
      <div>
        <Button
          variant="ghost"
          class="h-full min-h-max w-full"
          onclick={() => {
            search.state.setKey('showLocation', true);
            location.load({ city: city?.id, country: country?.id, state: state?.id });
          }}>
          <span class="text-xs">
            {#if city}{city.name},{/if}
            {#if state}{state.name},{/if}
            {#if country}{country.name}{/if}
          </span>
        </Button>
      </div>
    {/each}
  </div>
{:else}
  <MapLibre
    center={center}
    zoom={zoom}
    minZoom={1}
    class="h-96"
    standardControls
    style={mapStyle}>
    {#each locations as { city, country, latitude, longitude, state } (city?.id)}
      <DefaultMarker lngLat={[longitude || 0, latitude || 0]}>
        <Popup offset={[0, -10]}>
          <Button
            variant="ghost"
            class="h-full min-h-max w-full"
            onclick={() => {
              search.state.setKey('showLocation', true);
              location.load({
                city: city?.id,
                country: country?.id,
                state: state?.id
              });
            }}>
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
{/if}
