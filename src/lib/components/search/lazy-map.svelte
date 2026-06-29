<script lang="ts">
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

// Lazy-load the map component (defers maplibre-gl 44M dep until first render)
$effect(() => {
  import('./map.svelte').then((mod) => {
    MapComponent = mod.default;
  });
});
</script>

{#if MapComponent}
  <MapComponent {location} {locations} {search} />
{:else}
  <div class="flex h-96 w-full items-center justify-center rounded-lg bg-muted">
    <Skeleton class="h-full w-full" />
  </div>
{/if}
