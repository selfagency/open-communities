<script lang="ts">
import WarningIcon from '@tabler/icons-svelte/icons/alert-circle';
import AdaIcon from '@tabler/icons-svelte/icons/disabled';
import AslIcon from '@tabler/icons-svelte/icons/hand-two-fingers';
import EvaIcon from '@tabler/icons-svelte/icons/language';
import CcIcon from '@tabler/icons-svelte/icons/subtitles';
import { m } from '$lib/paraglide/messages';
import type { AccessibilityRecord } from '$lib/pocketbase.d';

let { accessibility }: { accessibility: AccessibilityRecord } = $props();

const ada = $derived(accessibility.inPerson_adaSome || accessibility.inPerson_adaAll);
const cc = $derived(accessibility.online_automatedCaptions || accessibility.online_liveCaptions);
const eva = $derived(accessibility.inPerson_eva);
const asl = $derived(accessibility.inPerson_asl || accessibility.online_asl);
const other = $derived(accessibility.otherText);
const noAccessibilityFeatures = $derived(!(ada || cc || eva || other));
</script>

<div class="col-span-3">
  <h3 class="label">{m.accessibility()}</h3>
</div>
<ul class="col-span-9 space-y-2">
  {#if ada}
    <li class="flex flex-row items-start justify-start space-x-1">
      <span class="flex flex-col items-start justify-start">
        <AdaIcon class="rtl:mx-2" size="18" />
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
        <CcIcon class="rtl:mx-2" size="18" />
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
        <AslIcon class="text-muted-foreground rtl:mx-2" size="16" />
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
        <EvaIcon class="rtl:mx-2" size="18" />
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
  {#if noAccessibilityFeatures}
    <li class="flex flex-row items-start justify-start space-x-1">
      <span class="flex flex-col items-start justify-start">
        <WarningIcon class="rtl:mx-2" size="18" />
        <span class="sr-only">{m.unspecified()}</span>
      </span>
      <span class="flex flex-col items-start justify-start">{m.unspecified()}</span>
    </li>
  {/if}
</ul>
