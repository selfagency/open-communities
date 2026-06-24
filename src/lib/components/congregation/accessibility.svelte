<script lang="ts">
  import WarningIcon from "@tabler/icons-svelte/icons/alert-circle";
  /* region imports */
  import AdaIcon from "@tabler/icons-svelte/icons/disabled";
  import AslIcon from "@tabler/icons-svelte/icons/hand-two-fingers";
  import EvaIcon from "@tabler/icons-svelte/icons/language";
  import CcIcon from "@tabler/icons-svelte/icons/subtitles";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { m } from "$lib/paraglide/messages";
  import type { AccessibilityRecord } from "$lib/pocketbase.d";

  /* endregion imports */

  /* region variables */
  // props
  const {
    accessibility,
    mode = $bindable("mini"),
  }: { accessibility: AccessibilityRecord; mode?: "full" | "mini" } = $props();

  // constants
  const ada = $derived(
    accessibility.inPerson_adaSome || accessibility.inPerson_adaAll,
  );
  const cc = $derived(
    accessibility.online_automatedCaptions || accessibility.online_liveCaptions,
  );
  const eva = $derived(accessibility.inPerson_eva);
  const asl = $derived(accessibility.inPerson_asl || accessibility.online_asl);
  const other = $derived(accessibility.otherText);
  /* endregion variables */
</script>

{#if mode === "mini"}
  <div
    class="flex w-full flex-row items-center justify-end space-x-1 antialiased"
  >
    {#if ada}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger class="flex h-7 w-7 items-center justify-center">
            <AdaIcon size="18" class="rtl:mx-1" />
            <span class="sr-only">{m.accessibility_ada()}</span>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <span class="text-nowrap">{m.accessibility_ada()}</span>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    {/if}
    {#if cc}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger class="flex h-7 w-7 items-center justify-center">
            <CcIcon size="18" class="rtl:mx-1" />
            <span class="sr-only">{m.accessibility_cc()}</span>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <span class="text-nowrap">{m.accessibility_cc()}</span>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    {/if}
    {#if eva}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger class="flex h-7 w-7 items-center justify-center">
            <EvaIcon size="18" class="rtl:mx-1" />
            <span class="sr-only">{m.accessibility_eva()}</span>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <span class="text-nowrap">{m.accessibility_eva()}</span>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    {/if}
    {#if asl}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger class="flex h-7 w-7 items-center justify-center">
            <AslIcon size="16" class="text-muted-foreground rtl:mx-1" />
            <span class="sr-only">{m.accessibility_asl()}</span>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <span class="text-nowrap">{m.accessibility_asl()}</span>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    {/if}
  </div>
{/if}

{#if mode === "full"}
  <div class="col-span-3">
    <h3 class="label">{m.accessibility()}</h3>
  </div>
  <ul class="col-span-9 space-y-2">
    {#if ada}
      <li class="flex flex-row items-start justify-start space-x-1">
        <span class="flex flex-col items-start justify-start">
          <AdaIcon size="18" class="rtl:mx-2" />
          <span class="sr-only">{m.accessibility_ada()}</span>
        </span>
        <span class="flex flex-col items-start justify-start">
          {#if accessibility.inPerson_adaSome}
            {m.accessibility_inPerson_adaSome()}
          {/if}
          {#if accessibility.inPerson_adaAll}
            {m.accessibility_inPerson_adaAll()}
          {/if}
        </span>
      </li>
    {/if}

    {#if cc}
      <li class="flex flex-row items-start justify-start space-x-1">
        <span class="flex flex-col items-start justify-start">
          <CcIcon size="18" class="rtl:mx-2" />
          <span class="sr-only">{m.accessibility_cc()}</span>
        </span>
        <span class="flex flex-col items-start justify-start">
          {#if accessibility.online_automatedCaptions}
            {m.accessibility_online_automatedCaptions()}
          {/if}
          {#if accessibility.online_liveCaptions}
            {m.accessibility_online_liveCaptions()}
          {/if}
        </span>
      </li>
    {/if}

    {#if asl}
      <li class="flex flex-row items-start justify-start space-x-1">
        <span class="flex flex-col items-start justify-start">
          <AslIcon size="16" class="text-muted-foreground rtl:mx-2" />
          <span class="sr-only">{m.accessibility_asl()}</span>
        </span>
        <span class="flex flex-col items-start justify-start">
          {#if accessibility.inPerson_asl}
            {m.accessibility_inPerson_asl()}
          {/if}
          {#if accessibility.online_asl}
            {m.accessibility_online_asl()}
          {/if}
        </span>
      </li>
    {/if}

    {#if eva}
      <li class="flex flex-row items-start justify-start space-x-1">
        <span class="flex flex-col items-start justify-start">
          <EvaIcon size="18" class="rtl:mx-2" />
          <span class="sr-only">{m.accessibility_eva()}</span>
        </span>
        <span class="flex flex-col items-start justify-start">
          {#if accessibility.inPerson_eva}
            {m.accessibility_inPerson_eva()}
          {/if}
        </span>
      </li>
    {/if}

    {#if other}
      <li class="flex flex-row items-start justify-start space-x-1">
        <span class="flex flex-col items-start justify-start">{other}</span>
      </li>
    {/if}

    {#if !ada && !cc && !eva && !other}
      <li class="flex flex-row items-start justify-start space-x-1">
        <span class="flex flex-col items-start justify-start">
          <WarningIcon size="18" class="rtl:mx-2" />
          <span class="sr-only">{m.unspecified()}</span>
        </span>

        <span class="flex flex-col items-start justify-start"
          >{m.unspecified()}</span
        >
      </li>
    {/if}
  </ul>
{/if}
