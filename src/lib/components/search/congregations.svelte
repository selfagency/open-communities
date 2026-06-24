<script lang="ts">
  import WarningIcon from "@tabler/icons-svelte/icons/alert-circle";
  import ClearIcon from "@tabler/icons-svelte/icons/circle-x";
  import LocationIcon from "@tabler/icons-svelte/icons/globe";
  import SearchIcon from "@tabler/icons-svelte/icons/search";
  /* region imports */
  import { alphabetical, isEmpty, sleep, unique } from "radashi";
  import { onMount, tick, untrack } from "svelte";
  import { fade } from "svelte/transition";
  import { dev } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import CongregationCard from "$lib/components/congregation/congregation.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Pagination from "$lib/components/ui/pagination";
  import { Location as LocationService } from "$lib/location";
  import { m } from "$lib/paraglide/messages";
  import type { CongregationMetaRecord } from "$lib/pocketbase.d";
  import { Search } from "$lib/search";
  import { state as appState } from "$lib/stores";
  import type { LocationMeta, SearchData, SearchState } from "$lib/types.d";

  import Filters from "./filters.svelte";
  import Location from "./location.svelte";
  import Map from "./map.svelte";

  /* endregion imports */

  /* region types */
  type Congregation = CongregationMetaRecord & { id: string };
  /* endregion types */

  /* region variables */
  // constants
  // id is handled via +page.svelte load → resolved before this component mounts
  const search = new Search(page.data.congregations as SearchData[], dev);
  const { results, state: searchState } = search;
  const location = new LocationService({
    countries: page.data.countries,
    search: search,
  });
  const open: Record<string, boolean> = {};

  // locals
  let loading = $state(true);
  let searchTerms = $state("");
  let currentPage = $state(1);
  let perPage = $state(9);
  let isPaging = $state(false);
  // let reset: boolean = false;
  /* endregion variables */

  /* region methods */
  async function onPageChange(pageNo: number) {
    // Blur the grid, wait for the blur to take effect, swap page, then unblur
    isPaging = true;
    await tick();
    // give the CSS a moment to start the blur
    await sleep(80);
    currentPage = pageNo;
    await tick();
    // wait for the blur duration to finish before removing it
    await sleep(320);
    isPaging = false;
  }
  /*endregion methods */

  /* region reactivity */
  const locations = $derived.by(() => {
    const resultsValue = $results;
    if (resultsValue.length && resultsValue.length > 0) {
      const allLocations = resultsValue
        .filter((l) => {
          const location = l.location as LocationMeta;
          return [
            location.city?.name,
            location.state?.name,
            location.country?.name,
          ].every((l) => !isEmpty(l));
        })
        .map((l) => {
          const location = l.location as LocationMeta;
          return {
            city: location.city,
            country: location.country,
            latitude:
              location.city?.latitude ||
              location.state?.latitude ||
              location.country?.latitude,
            longitude:
              location.city?.longitude ||
              location.state?.longitude ||
              location.country?.longitude,
            state: location.state,
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
        result.push(items.slice(i, i + perPage));
      }
    }
    return result;
  });

  onMount(async () => {
    await tick();
    // Handle ?id= query param — open the congregation card directly
    const id = page.url.searchParams.get("id");
    if (id) {
      searchTerms = id;
      open[id] = true;
      // Clean up the URL without navigating
      const url = new URL(page.url);
      url.searchParams.delete("id");
      goto(url.pathname + url.search, {
        replaceState: true,
        noScroll: true,
        keepFocus: true,
      });
    }
    await sleep(200); // brief delay so the fade-in transition renders
    loading = false;
  });

  $effect(() => {
    if ($results) {
      untrack(() => {
        currentPage = 1;
      });
    }
  });

  $effect(() => {
    const terms = searchTerms;
    untrack(() => search.setSearchTerms(terms));
  });
  /* endregion reactivity */
  const skeletons = [1, 2, 3];
  let isMobile = $derived(appState.isMobile);
</script>

<section class="w-full space-y-4">
  {#if loading}
    <div
      class="grid w-full auto-cols-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
    >
      {#each skeletons as s}
        <div class="col-span-1">
          <div
            class="flex h-full min-h-56 animate-pulse flex-col justify-between rounded-xl border bg-background p-4"
          >
            <div class="space-y-2">
              <div class="h-5 w-3/4 rounded bg-muted"></div>
              <div class="h-3 w-1/2 rounded bg-muted"></div>
            </div>
            <div class="mt-4 space-y-2">
              <div class="h-3 w-full rounded bg-muted"></div>
              <div class="h-3 w-5/6 rounded bg-muted"></div>
            </div>
            <div class="mt-4 flex flex-row space-x-1">
              <div class="h-6 w-6 rounded-full bg-muted"></div>
              <div class="h-6 w-6 rounded-full bg-muted"></div>
              <div class="h-6 w-6 rounded-full bg-muted"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div
      class="flex w-full flex-col items-center justify-between space-y-4 space-x-0 sm:flex-row sm:space-y-0 sm:space-x-4 rtl:sm:space-x-0"
      transition:fade={{ delay: 300, duration: 300 }}
    >
      <div
        class="relative flex w-full min-w-max flex-row items-center justify-start space-x-2 text-muted-foreground"
      >
        <Label for="search" class="flex w-8 items-center justify-center">
          <SearchIcon size="20" />
          <span class="sr-only">{m.search()}</span>
        </Label>
        <span class="w-full">
          <Input
            placeholder={m.search()}
            bind:value={searchTerms}
            id="search"
            class="w-full h-11 placeholder:text-muted-foreground"
          />

          <span
            class="absolute top-0 z-10 h-11 w-11 ltr:right-0 rtl:left-0 rtl:mx-1"
          >
            <Button
              variant="link"
              class="text-muted-foreground hover:text-secondary-foreground"
              onclick={() => {
                searchTerms = "";
                search.setSearchTerms(searchTerms);
              }}
            >
              <ClearIcon size="16" />
              <span class="sr-only">{m.clear()}</span>
            </Button>
          </span>
        </span>
      </div>

      <div
        class="flex w-full flex-row items-center justify-end space-x-2 sm:w-auto"
      >
        <Button
          variant="outline"
          class={`space-x-2 text-muted-foreground rtl:mx-1 ${$searchState.showLocation ? "bg-muted" : ""}`}
          onclick={() => {
            search.toggleLocation();
          }}
        >
          <LocationIcon size="20" class="rtl:mx-1" />
          <span>{m.location()}</span>
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

    {#if $results?.length === 0}
      <div
        class="col-span-3 flex flex-row items-center justify-center space-x-2 py-12 text-muted-foreground"
      >
        <WarningIcon size="20" />
        <span>{m.nothingFound()}</span>
      </div>
    {:else if pages?.length > 0}
      <div
        class="grid w-full auto-cols-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        class:blurred={isPaging}
      >
        {#each pages[currentPage - 1] as congregation (congregation.id + "-" + currentPage)}
          <div class="col-span-1">
            <CongregationCard
              {congregation}
              open={open[congregation.id] ?? false}
            />
          </div>
        {/each}
      </div>
    {/if}

    <div
      class="flex w-full scale-90 flex-row items-center justify-center pt-4 sm:scale-100"
    >
      <Pagination.Root
        count={$results?.length || 0}
        {perPage}
        {onPageChange}
        siblingCount={isMobile ? 0 : 1}
      >
        {#snippet children({ currentPage, pages })}
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.PrevButton />
            </Pagination.Item>
            {#each pages as page (page.key)}
              {#if page.type === "ellipsis"}
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

<style>
  /* scoped: smooth CSS-only blur during page swaps without affecting layout */
  .grid.blurred {
    filter: blur(8px);
    opacity: 0.65;
    transform: scale(0.996);
    will-change: filter, opacity, transform;
    transition:
      filter 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
      opacity 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
      transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
</style>
