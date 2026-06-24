<script lang="ts">
  /* region imports */
  import EditIcon from "@tabler/icons-svelte/icons/pencil";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Badge } from "$lib/components/ui/badge";
  import * as Card from "$lib/components/ui/card";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { m } from "$lib/paraglide/messages";
  import type {
    AccessibilityRecord,
    CitiesRecord as City,
    CongregationMetaRecord,
    CountriesRecord as Country,
    FitRecord,
    HealthRecord,
    SecurityRecord,
    ServicesRecord,
    StatesRecord as State,
  } from "$lib/pocketbase.d";

  import Accessibility from "./accessibility.svelte";
  import Flag from "./flag.svelte";
  import Health from "./health.svelte";
  import Security from "./security.svelte";

  /* endregion imports */

  /* region variables */
  // props
  const {
    congregation,
  }: { congregation: CongregationMetaRecord & { id: string } } = $props();

  // constants
  const user = $derived(page.data.user);
  const accessibility = $derived(
    congregation?.accessibility,
  ) as AccessibilityRecord;
  const health = $derived(congregation?.health) as HealthRecord;
  const services = $derived(congregation?.services) as ServicesRecord;
  const security = $derived(congregation?.security) as SecurityRecord;
  const location = $derived(congregation?.location) as {
    city: City;
    country: Country;
    state: State;
  };
  const flag = $derived((congregation?.fit as FitRecord)?.flag);
  /* endregion variables */
</script>

<Card.Root
  class="flex h-full min-h-max flex-col justify-between transition-transform hover:scale-105 ltr:text-left rtl:text-right"
>
  <Card.Header>
    <Card.Title>
      <h2
        class="font-display text-xl leading-6 font-normal tracking-wide text-secondary-foreground"
      >
        {congregation.name}
      </h2>
    </Card.Title>
    <Card.Description class="text-muted-foreground -mt-1">
      {#if services.onlineOnly}
        <span>{m.services_onlineOnly()}</span
        >{#if location.country.name && location.country.name !== "United States"}<span
            >, {location.country.name}</span
          >{/if}
      {:else if location.city.name || location.state.name || location.country.name}
        {#if location.city.name}<span>{location.city.name}</span
          >{#if location.state.name || location.country.name},{/if}{/if}
        {#if location.state.name}<span>{location.state.name}</span
          >{#if location.country.name && location.country.name !== "United States"},{/if}{/if}
        {#if location.country.name && location.country.name !== "United States"}<span
            >{location.country.name}</span
          >{/if}
      {/if}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <p class="line-clamp-3 text-sm">{congregation.flavor}</p>
  </Card.Content>
  {#if accessibility || user?.admin}
    <Card.Footer class="">
      <div class="flex w-full flex-row items-center justify-between space-x-2">
        <div class="flex w-auto flex-row items-center justify-end">
          {#if !congregation.visible}
            <Badge variant="outline">{m.pending()}</Badge>
          {:else}
            {#if security}
              <Security {security} mode="mini" />
            {/if}
            {#if health}
              <Health {health} mode="mini" />
            {/if}
            {#if accessibility}
              <Accessibility {accessibility} mode="mini" />
            {/if}
            {#if flag}
              <Flag {flag} mode="mini" />
            {/if}
          {/if}
        </div>
        {#if user?.admin}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger
                class="group button ghost h-8 px-2 py-0"
                onclick={async (e: Event) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = `/edit?id=${congregation.id}`;
                  await goto(url);
                }}
              >
                <EditIcon size="16" class="text-secondary-foreground transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-12 motion-safe:active:scale-90" />
                <span class="sr-only">{m.edit()}</span>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <span class="text-nowrap">{m.edit()}</span>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        {/if}
      </div>
    </Card.Footer>
  {/if}
</Card.Root>
