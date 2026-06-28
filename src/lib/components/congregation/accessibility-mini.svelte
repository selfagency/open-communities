<script lang="ts">
import AdaIcon from '@tabler/icons-svelte/icons/disabled';
import AslIcon from '@tabler/icons-svelte/icons/hand-two-fingers';
import EvaIcon from '@tabler/icons-svelte/icons/language';
import CcIcon from '@tabler/icons-svelte/icons/subtitles';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Tooltip from '$lib/components/ui/tooltip';
import { m } from '$lib/paraglide/messages';
import type { AccessibilityRecord } from '$lib/pocketbase.d';

let { accessibility }: { accessibility: AccessibilityRecord } = $props();

const ada = $derived(accessibility.inPerson_adaSome || accessibility.inPerson_adaAll);
const cc = $derived(accessibility.online_automatedCaptions || accessibility.online_liveCaptions);
const eva = $derived(accessibility.inPerson_eva);
const asl = $derived(accessibility.inPerson_asl || accessibility.online_asl);
</script>

<div class="flex w-full flex-row items-center justify-end space-x-1 antialiased">
  {#if ada}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger class="flex h-7 w-7 items-center justify-center">
          <AdaIcon size="16" />
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
          <CcIcon size="16" />
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
          <EvaIcon size="16" />
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
          <AslIcon class="text-muted-foreground" size="16" />
          <span class="sr-only">{m.accessibility_asl()}</span>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <span class="text-nowrap">{m.accessibility_asl()}</span>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {/if}
</div>
