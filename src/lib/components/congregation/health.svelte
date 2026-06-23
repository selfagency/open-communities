<script lang="ts">
  /* region imports */
  import WarningIcon from "@lucide/svelte/icons/circle-alert";
  import MaskIcon from "$lib/assets/mask.svg?component";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { m } from "$lib/paraglide/messages";
  import type { HealthRecord } from "$lib/pocketbase.d";

  /* endregion imports */

  /* region variables */
  // props
  const {
    health,
    mode = $bindable("full"),
  }: { health?: HealthRecord; mode?: "full" | "mini" } = $props();
  /* endregion variables */
</script>

{#if mode === "mini"}
  {#if health?.protocol === "maskingRecommended" || health?.protocol === "maskingRequired" || (health?.protocol === "other" && health?.otherText !== "N/A")}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <span><MaskIcon class="mt-1 h-5 w-5 text-muted-foreground fill-current rtl:mx-1" /></span>
          <span class="sr-only">{m[`health_${health.protocol}`]()}</span>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <span class="text-nowrap">{m[`health_${health.protocol}`]()}</span>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {/if}
{:else}
  <div class="col-span-3">
    <h2 class="label">{m.health()}</h2>
  </div>

  <ul class="col-span-9 space-y-2">
    {#if health?.protocol === "other" && health?.otherText === "N/A"}
      {m.health_notApplicable()}
    {:else}
      {#if health?.protocol === "maskingRecommended"}
        <li class="flex flex-row items-center justify-start space-x-1">
          <span><MaskIcon class="mt-1 h-5 w-5 rtl:mx-2" /></span>
          <span>{m.health_maskingRecommended()}</span>
        </li>
      {/if}

      {#if health?.protocol === "maskingRequired"}
        <li class="flex flex-row items-center justify-start space-x-1">
          <span><MaskIcon class="mt-1 h-5 w-5 rtl:mx-2" /></span>
          <span>{m.health_maskingRequired()}</span>
        </li>
      {/if}

      {#if health?.protocol === "noGuidelines"}
        <li class="flex flex-row items-center justify-start space-x-1">
          <span><WarningIcon size="18" class="rtl:mx-2" /></span>
          <span>{m.health_noGuidelines()}</span>
        </li>
      {/if}

      {#if health?.protocol === "other"}
        <li class="flex flex-row items-center justify-start space-x-1">
          <span>{health.otherText}</span>
        </li>
      {/if}
    {/if}
  </ul>
{/if}
