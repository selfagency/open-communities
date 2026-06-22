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
  import type { LocationMeta } from '$lib/types.d';

  /* endregion imports */

  /* region variables */
  const { location, search }: { location: Location; search: Search } = $props();
  // svelte-ignore state_referenced_locally
  const { reset, setCity, setCountry, setState, state: locationState } = location;

  let country = $state(untrack(() => $locationState.record.country?.id ?? ''));
  let province = $state(untrack(() => $locationState.record.state?.id ?? ''));
  let city = $state(untrack(() => $locationState.record.city?.id ?? ''));
  /* endregion variables */

  /* region methods */
  async function handleCountryChange(selectedId: string) {
    country = selectedId;
    await setCountry(selectedId);
    search.setSearchLocation($locationState.record as LocationMeta);
  }

  async function handleStateChange(selectedId: string) {
    province = selectedId;
    await setState(selectedId);
    search.setSearchLocation($locationState.record as LocationMeta);
  }

  function handleCityChange(selectedId: string) {
    city = selectedId;
    setCity(selectedId);
    search.setSearchLocation($locationState.record as LocationMeta);
  }

  function handleReset() {
    reset();
    search.resetLocation();
  }
  /* endregion methods */

  /* region reactivity */
  // Sync local state from the store — READ-ONLY. Does NOT call search.setSearchLocation
  // to avoid a circular update loop (search store -> locationState -> effect -> search store).
  $effect(() => {
    const loc = $locationState.record;

    untrack(() => {
      if (country !== (loc.country?.id ?? '')) country = loc.country?.id ?? '';
      if (province !== (loc.state?.id ?? '')) province = loc.state?.id ?? '';
      if (city !== (loc.city?.id ?? '')) city = loc.city?.id ?? '';
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
          disabled={!$locationState.options?.stateOptions?.length} />
      </span>

      <span class="w-full sm:w-1/3">
        <Combobox
          items={$locationState.options.cityOptions}
          value={city}
          onChange={handleCityChange}
          placeholder={m.selectThing({ thing: m.location_city().toLowerCase() })}
          disabled={!$locationState.options?.cityOptions?.length} />
      </span>
    </div>

    <span class="flex w-full flex-row items-center justify-center sm:w-auto">
      <Button variant="link" class="h-auto" onclick={handleReset}>
        <span class="flex flex-row items-center justify-start space-x-1 text-slate-500 hover:text-slate-700">
          <ResetIcon size="16" class="rtl:mx-1" />
          <span>{m.reset()}</span>
        </span>
      </Button>
    </span>
  </div>
{/if}
