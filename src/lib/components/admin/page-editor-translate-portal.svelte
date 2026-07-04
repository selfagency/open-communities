<script lang="ts">
import CircleCheckIcon from '@tabler/icons-svelte/icons/circle-check';
import CircleXIcon from '@tabler/icons-svelte/icons/circle-x';
import LanguageIcon from '@tabler/icons-svelte/icons/language';
import LoadingIcon from '@tabler/icons-svelte/icons/loader';
import { onDestroy, onMount } from 'svelte';
import { browser } from '$app/environment';
import TranslateButton from '$lib/components/admin/translate-button.svelte';
import getPortal from '$lib/components/ui/portal/portal';
import { createPortalPosition } from '$lib/components/ui/portal/usePortalPosition';

export let langCode: string;
export let translateStatus: string;
export let selectedLang: string;
export let translating: boolean;
export let content: string;
export let onTranslate: (lang: string) => void;

let hostRect = { top: 0, left: 0, width: 0, height: 0 };
let hostEl: HTMLElement | null = null;
let Portal: any | undefined;
const pos = createPortalPosition(hostEl);

function updateRect() {
  const r = pos.update();
  hostRect = r.hostRect;
  // keep scroll values in sync for positioning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { scrollX, scrollY } = r;
}

onMount(async () => {
  if (!browser) {
    return;
  }
  updateRect();
  // Resolve Portal dynamically in browser-only context
  const p = await getPortal();
  Portal = p;
  window.addEventListener('resize', updateRect);
  window.addEventListener('scroll', updateRect, true);
});

onDestroy(() => {
  if (!browser) {
    return;
  }
  window.removeEventListener('resize', updateRect);
  window.removeEventListener('scroll', updateRect, true);
});
</script>

<div style="display: contents;" bind:this={hostEl}></div>

{#if Portal}
  <svelte:component target="body" this={Portal}>
    <div class="pointer-events-auto translate-portal" style="position:absolute;">
      <div style={`transform: translate(${hostRect.left + hostRect.width - 48}px, ${hostRect.top}px)`}>
        <TranslateButton {content} {langCode} {onTranslate} {selectedLang} {translateStatus} {translating} />
      </div>
    </div>
  </svelte:component>
{:else}
  <!-- Fallback: inline button when Portal unavailable -->
  <div class="pointer-events-auto" style="display:inline-block;">
    <TranslateButton {content} {langCode} {onTranslate} {selectedLang} {translateStatus} {translating} />
  </div>
{/if}

<style>
/* ensure portalled button does not capture pointer events except its own */
.pointer-events-auto {
  pointer-events: auto;
}
</style>
