<script lang="ts">
import type { AccessibilityRecord } from '$lib/pocketbase.d';
import AccessibilityFull from './accessibility-full.svelte';
import AccessibilityMini from './accessibility-mini.svelte';

const { accessibility, mode = $bindable('mini') }: { accessibility: AccessibilityRecord; mode?: 'full' | 'mini' } =
  $props();
</script>

{#if mode === "mini"}
  <AccessibilityMini {accessibility} />
{/if}

{#if mode === "full"}
  <AccessibilityFull {accessibility} />
{/if}
