<script lang="ts">
import { browser } from '$app/environment';
import { Skeleton } from '$lib/components/ui/skeleton';
import type { Location } from '$lib/location';
import type { Search } from '$lib/search';
import type { LocationMeta } from '$lib/types.d';

let {
  location,
  locations = $bindable([] as LocationMeta[]),
  search
}: {
  location: Location;
  locations: LocationMeta[];
  search: Search;
} = $props();

let MapComponent: typeof import('./map.svelte').default | null = $state(null);

// Lazy-load the map component (defers maplibre-gl dep until first render)
$effect(() => {
  import('./map.svelte').then((mod) => {
    MapComponent = mod.default;
  });
});

// Track when maplibregl global is available (loaded via svelte:head CDN script)
let maplibreglReady = $state(!browser || !!(typeof window !== 'undefined' && window.maplibregl));

$effect(() => {
  if (maplibreglReady || !browser) {
    return;
  }
  const id = setInterval(() => {
    if (typeof window !== 'undefined' && window.maplibregl) {
      maplibreglReady = true;
      clearInterval(id);
    }
  }, 100);
  return () => clearInterval(id);
});
</script>

<svelte:head>
  <link href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css" rel="stylesheet" />
  <script async src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
</svelte:head>

{#if MapComponent && maplibreglReady}
  <MapComponent {location} {locations} {search} />
{:else}
  <div class="flex h-96 w-full items-center justify-center rounded-lg bg-muted">
    <Skeleton class="h-full w-full" />
  </div>
{/if}
