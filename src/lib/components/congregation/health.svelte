<script lang="ts">
/* region imports */
import WarningIcon from '@tabler/icons-svelte/icons/alert-circle';
import MaskIcon from '@tabler/icons-svelte/icons/face-mask';
import * as Tooltip from '$lib/components/ui/tooltip';
import { m } from '$lib/paraglide/messages';
import type { HealthRecord } from '$lib/pocketbase.d';

/* endregion imports */

/* region variables */
// props
const { health, mode = $bindable('full') }: { health?: HealthRecord; mode?: 'full' | 'mini' } = $props();
/* endregion variables */
</script>

{#if mode === "mini"}
  {#if health?.protocol === "maskingRecommended" || health?.protocol === "maskingRequired" || (health?.protocol === "other" && health?.otherText !== "N/A")}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger class="flex h-7 w-7 items-center justify-center">
          <span><MaskIcon size="16" class="text-muted-foreground " /></span>
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
    <h3 class="label">{m.health()}</h3>
  </div>

  <ul class="col-span-9 space-y-2">
    {#if health?.protocol === "other" && health?.otherText === "N/A"}
      {m.health_notApplicable()}
    {:else}
      {#if health?.protocol === "maskingRecommended"}
        <li class="flex flex-row items-center justify-start space-x-1">
          <span><MaskIcon size="20" class="text-muted-foreground rtl:mx-2" /></span>
          <span>{m.health_maskingRecommended()}</span>
        </li>
      {/if}

      {#if health?.protocol === "maskingRequired"}
        <li class="flex flex-row items-center justify-start space-x-1">
          <span><MaskIcon size="20" class="text-muted-foreground rtl:mx-2" /></span>
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
