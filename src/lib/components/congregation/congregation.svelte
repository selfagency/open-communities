<script lang="ts">
  /* region imports */
  import EditIcon from "@lucide/svelte/icons/pencil";
  import ShareIcon from "@lucide/svelte/icons/share";
  import LinkIcon from "@lucide/svelte/icons/square-arrow-out-up-right";
  import DOMPurify from "isomorphic-dompurify";
  import { isEmpty, omit } from "radashi";
  import { fade } from "svelte/transition";
  import { copyText } from "svelte-copy";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Badge } from "$lib/components/ui/badge";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Separator } from "$lib/components/ui/separator";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { m as mBase } from "$lib/paraglide/messages";
  const m = mBase as Record<string, (...args: unknown[]) => string>;
  import type {
    AccessibilityRecord,
    CitiesRecord as City,
    CongregationMetaRecord,
    CountriesRecord as Country,
    FitRecord,
    HealthRecord,
    RegistrationRecord,
    SecurityRecord,
    ServicesRecord,
    StatesRecord as State,
  } from "$lib/pocketbase.d";

  import Accessibility from "./accessibility.svelte";
  import Contact from "./contact.svelte";
  import Fit from "./fit.svelte";
  import Flag from "./flag.svelte";
  import Health from "./health.svelte";
  import Registration from "./registration.svelte";
  import Security from "./security.svelte";
  import Services from "./services.svelte";
  import Tile from "./tile.svelte";

  /* endregion imports */

  /* region variables */
  // props
  let {
    congregation,
    open = $bindable(false),
  }: {
    congregation: CongregationMetaRecord & { id: string };
    open?: boolean;
  } = $props();

  // constants
  const accessibility = $derived(
    congregation.accessibility,
  ) as AccessibilityRecord;
  const fit = $derived(congregation.fit) as FitRecord;
  const {
    city,
    country,
    state: province,
  } = $derived(congregation.location) as {
    city: City;
    country: Country;
    state: State;
  };
  const notes = $derived(congregation.notes) as string;
  const services = $derived(congregation.services) as ServicesRecord;
  const registration = $derived(
    congregation.registration,
  ) as RegistrationRecord;
  const health = $derived(congregation.health) as HealthRecord;
  const security = $derived(congregation.security) as SecurityRecord;
  const user = $derived(page.data.user);

  // locals
  let tab: "about" | "details" | "services" = $state("about");
  /* endregion variables */

  /* region methods */
  const allFalse = (obj: Record<string, unknown>) =>
    Object.values(omit(obj, ["id", "otherText"])).every((v) => !v);
  /* endregion methods */

  /* region reactivity */
  $effect(() => {
    if (!open) tab = "about";
  });
  /* endregion reactivity */
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="h-full min-h-max w-full">
    <Tile {congregation} />
  </Dialog.Trigger>
  <Dialog.Content
    data-id={congregation.id}
    class="flex max-h-[85vh] min-h-[35vh] max-w-[360px] min-w-[360px] flex-col items-start justify-start overflow-y-scroll p-6 transition-colors sm:max-w-[540px] sm:p-8"
  >
    <Dialog.Header class="w-full rtl:text-right">
      <Dialog.Title>
        {#if congregation.contactUrl}
          <!-- external link -->
          <a
            href={congregation.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block max-w-[92%] hyphens-auto"
          >
            <h1 class="inline-block text-2xl leading-7 text-secondary-foreground">
              <span>{congregation.name}</span>
              <span
                ><LinkIcon
                  size="14"
                  color="gray"
                  class="inline rtl:mx-1"
                /></span
              >
            </h1>
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        {:else}
          <h1 class="inline text-2xl leading-6 text-secondary-foreground">
            {congregation.name}
          </h1>
        {/if}
      </Dialog.Title>
      <Dialog.Description
        class="flex w-full flex-row items-center justify-between space-x-2 text-muted-foreground -mt-4"
      >
        <span class="w-2/3">
          {#if city.name || province.name || country.name}
            {#if city.name}<span>{city.name}</span
              >{#if province.name || country.name},{/if}{/if}
            {#if province.name}<span>{province.name}</span
              >{#if country.name && country.name !== "United States"},{/if}{/if}
            {#if country.name && country.name !== "United States"}<span
                >{country.name}</span
              >{/if}
          {:else if services.onlineOnly}
            {m.services_onlineOnly()}
          {/if}
        </span>

        <div class="flex w-1/3 flex-row items-center justify-end space-x-1">
          {#if isEmpty(congregation.owner) && !user?.admin}
            <a href={`/contact?claim=${congregation.id}`}>
              <Badge
                variant="outline"
                class="font-normal text-nowrap text-muted-foreground hover:bg-muted"
                >{m.claimThis()}</Badge
              >
            </a>
          {/if}
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
          {#if user?.admin}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger
                  class="button ghost h-8 px-2 py-0"
                  onclick={async () => {
                    const url = `/edit?id=${congregation.id}`;
                    await goto(url);
                  }}
                >
                  <EditIcon size="16" class="text-muted-foreground rtl:mx-1" />
                  <span class="sr-only">{m.edit()}</span>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <span class="text-nowrap">{m.edit()}</span>
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          {/if}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger
                class="button ghost h-8 px-2 py-0"
                onclick={() => {
                  copyText(
                    `https://opencommunities.info?id=${congregation.id}`,
                  );
                  toast.success(m.copied());
                }}
              >
                <ShareIcon size="16" class="text-muted-foreground rtl:mx-1" />
                <span class="sr-only">{m.share()}</span>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <span class="text-nowrap">{m.share()}</span>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      </Dialog.Description>
    </Dialog.Header>

    <Tabs.Root bind:value={tab} class="w-full">
      <Tabs.List class="my-4 w-full">
        <Tabs.Trigger value="about" class="w-1/2 transition-colors"
          >{m.about()}</Tabs.Trigger
        >
        <Tabs.Trigger value="services" class="w-1/2 transition-colors"
          >{m.services()}</Tabs.Trigger
        >
        <Tabs.Trigger value="details" class="w-1/2 transition-colors"
          >{m.details()}</Tabs.Trigger
        >
      </Tabs.List>
      <Tabs.Content value="about" class="transition-opacity duration-300">
        {#if tab === "about"}
          <div transition:fade>
            {#if congregation.flavor}
              <p class="mb-6 text-sm">
                {@html DOMPurify.sanitize(congregation.flavor)}
              </p>
            {/if}

            <div class="grid grid-cols-12 gap-4 text-sm">
              {#if congregation.denomination}
                {@const denomKey = `denomination_${congregation.denomination}`}
                <div class="col-span-3 flex flex-row items-start justify-start">
                  <h2 class="label">{m.denomination_affiliation()}</h2>
                </div>
                <div class="col-span-9 flex flex-row items-start justify-start">
                  {m[denomKey]()}
                </div>
              {/if}

              {#if !allFalse(fit)}
                {#if congregation.denomination || congregation.flavor}<Separator
                    class="col-span-12"
                  />{/if}
                <Fit {fit} />
              {/if}

              {#if user?.admin && (congregation.contactName || congregation.contactEmail)}
                <Separator class="col-span-12" />
                <Contact
                  contactName={congregation.contactName}
                  contactEmail={congregation.contactEmail}
                />
              {/if}
            </div>
          </div>
        {/if}
      </Tabs.Content>
      <Tabs.Content value="services">
        {#if tab === "services"}
          <div transition:fade>
            <div class="grid grid-cols-12 gap-4 text-sm">
              {#if congregation.clergy}
                <div class="col-span-3 flex flex-row items-start justify-start">
                  <h2 class="label">{m.clergy_clergy()}</h2>
                </div>
                <div class="col-span-9 flex flex-row items-start justify-start">
                  {congregation.clergy}
                </div>
              {/if}

              {#if !allFalse(services)}
                {#if congregation.clergy}<Separator class="col-span-12" />{/if}
                <Services {services} />
              {/if}

              {#if !allFalse(registration)}
                {#if congregation.clergy || !allFalse(services)}<Separator
                    class="col-span-12"
                  />{/if}
                <Registration {registration} />
              {/if}
            </div>
          </div>
        {/if}
      </Tabs.Content>
      <Tabs.Content value="details">
        {#if tab === "details"}
          <div transition:fade>
            <div class="grid grid-cols-12 gap-4 text-sm">
              {#if fit.flag}
                <Flag flag={fit.flag} mode="full" />
              {/if}

              {#if !allFalse(accessibility)}
                {#if fit.flag}<Separator class="col-span-12" />{/if}
                <Accessibility {accessibility} mode="full" />
              {/if}

              {#if health.protocol}
                {#if fit.flag || !allFalse(accessibility)}<Separator
                    class="col-span-12"
                  />{/if}
                <Health {health} />
              {/if}

              {#if !allFalse(security)}
                {#if fit.flag || health.protocol || !allFalse(accessibility)}<Separator
                    class="col-span-12"
                  />{/if}
                <Security {security} />
              {/if}

              {#if notes}
                {#if fit.flag || health.protocol || !allFalse(accessibility) || !allFalse(security)}
                  <Separator class="col-span-12" />
                {/if}
                <div class="col-span-3 flex flex-row items-start justify-start">
                  <h2 class="label">{m.notes()}</h2>
                </div>
                <div class="col-span-9 flex flex-row items-start justify-start">
                  <p>{@html DOMPurify.sanitize(notes)}</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </Tabs.Content>
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>
