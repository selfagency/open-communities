<script lang="ts">
/* region imports */
import Flag from '@tabler/icons-svelte/icons/flag';
import FlagOff from '@tabler/icons-svelte/icons/flag-off';
import * as Tooltip from '$lib/components/ui/tooltip';
import { m } from '$lib/paraglide/messages';
import type { FitRecord } from '$lib/pocketbase.d';

/* endregion imports */

/* region variables */
// props
const { flag, mode = $bindable('mini') }: { flag?: FitRecord['flag']; mode?: 'full' | 'mini' } = $props();
/* endregion variables */
</script>

{#if flag}
  {#if mode === "mini"}
    <div class="flex w-full flex-row items-center justify-end space-x-1 antialiased">
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger class="group flex h-7 w-7 items-center justify-center">
            {#if flag === "no"}
              <FlagOff
                class="rtl:mx-1 transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:active:scale-90"
                size="16"
              />
            {:else}
              <Flag
                class="rtl:mx-1 transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:active:scale-90"
                size="16"
              />
            {/if}
            <span class="sr-only">{m[`flag_${flag}`]()}</span>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <span class="text-nowrap">{m[`flag_${flag}`]()}</span>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  {:else}
    <div class="col-span-3">
      <h3 class="label">{m.flag_short()}</h3>
    </div>
    <div class="col-span-9">
      {#if flag === "no"}
        <div class="flex flex-row items-center space-x-2">
          <FlagOff
            class="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:hover:scale-110"
          />
          <span>{m.flag_no()}</span>
        </div>
      {:else if flag === "yes"}
        <div class="flex flex-row items-center space-x-2">
          <Flag class="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:hover:scale-110" />
          <span>{m.flag_yes()}</span>
        </div>
      {:else if flag === "yesBima"}
        <div class="flex flex-row items-center space-x-2">
          <Flag class="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:hover:scale-110" />
          <span>{m.flag_yesBima()}</span>
        </div>
      {/if}
    </div>
  {/if}
{/if}
