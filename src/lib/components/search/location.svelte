<script lang="ts">
  /* region imports */
  import ResetIcon from 'lucide-svelte/icons/circle-x';
  import { isEmpty } from 'radashi';
  import { untrack } from 'svelte';

  import Combobox from '$lib/components/global/combobox.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { Location } from '$lib/location';
  import { m } from '$lib/paraglide/messages';
  import type { Search } from '$lib/search';

  /* endregion imports */

  /* region variables */
  // props
  const { location, search }: { location: Location; search: Search } = $props();

  // constants
  const { reset, setCity, setCountry, setState, state: locationState } = location;

  // locals
  // Initialize state from the store without creating a subscription.
  let country = $state(untrack(() => $locationState.record.country?.id ?? ''));
  let province = $state(untrack(() => $locationState.record.state?.id ?? ''));
  let city = $state(untrack(() => $locationState.record.city?.id ?? ''));

  /* region methods */
  function handleCountryChange(selectedId: string) {
    country = selectedId;
    setCountry(selectedId);
    // Sync to search store after location updates
    search.setSearchLocation($locationState.record);
  }

  function handleStateChange(selectedId: string) {
    province = selectedId;
    setState(selectedId);
    search.setSearchLocation($locationState.record);
  }

  function handleCityChange(selectedId: string) {
    city = selectedId;
    setCity(selectedId);
    search.setSearchLocation($locationState.record);
  }

  function handleReset() {
    reset();
    search.setSearchLocation(null);
  }
  /* endregion methods */

  /* region reactivity */
  // Sync local state from the store — this effect is READ-ONLY.
  // It must NOT call search.setSearchLocation() because that would create
  // a circular update loop (search store → location state → this effect → search store).
  $effect(() => {
    const loc = $locationState.record;

    untrack(() => {
      if (country !== (loc.country?.id ?? '')) {
        country = loc.country?.id ?? '';
      }
      if (province !== (loc.state?.id ?? '')) {
        province = loc.state?.id ?? '';
      }
      if (city !== (loc.city?.id ?? '')) {
        city = loc.city?.id ?? '';
      }
    });
  });
  /* endregion reactivity */
</script>

{#if !isEmpty($locationState.options)}
  <div
    class="flex w-full flex-col items-center justify-between space-y-2 rounded-lg bg-slate-100 p-2 sm:flex-row sm:space-y-0 sm:space-x-2">
    <div class="flex w-full flex-col items-center justify-start space-y-4 sm:flex-row sm:space-y-0 sm:space-x-2">
      <span class="w-full sm:w-1/3">
        <Combobox
          items={$locationState.options.countryOptions}
          value={country}
          onChange={handleCountryChange}
          placeholder={m.selectThing({ thing: m.location_country().toLowerCase() })}
          disabled={!$locationState.options?.countryOptions?.length} />
      </span>

      <span class="w-full sm:w-1/3">
        <Combobox
          items={$locationState.options.stateOptions}
          value={province}
          onChange={handleStateChange}
          placeholder={m.selectThing({ thing: m.location_state().toLowerCase() })}
          disabled={!country || !$locationState.options?.stateOptions?.length} />
      </span>

      <span class="w-full sm:w-1/3">
        <Combobox
          items={$locationState.options.cityOptions}
          value={city}
          onChange={handleCityChange}
          placeholder={m.selectThing({ thing: m.location_city().toLowerCase() })}
          disabled={!province || !$locationState.options?.cityOptions?.length} />
      </span>
    </div>

    <span>
      <Button
        variant="link"
        class="h-auto"
        onclick={handleReset}>
        <span class="flex flex-row items-center justify-start space-x-1 text-slate-500 hover:text-slate-700">
          <ResetIcon size="16" class="rtl:mx-1" />
          <span>{m.reset()}</span>
        </span>
      </Button>
    </span>
  </div>
{/if}
