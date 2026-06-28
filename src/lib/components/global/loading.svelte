<script lang="ts">
import Loading from '@tabler/icons-svelte/icons/loader';
import { m } from '$lib/paraglide/messages';

const { class: className = '', variant = 'default' }: { class?: string; variant?: 'default' | 'full' } = $props();

import { fade } from 'svelte/transition';
</script>

<div
  aria-label={m.loading()}
  class={`my-4 flex h-full w-full flex-col items-center justify-center ${className}`}
  role="status"
  class:min-h-[50vh]={variant === "full"}
  in:fade={{ duration: 300 }}
  out:fade={{ duration: 300 }}
>
  <Loading aria-hidden="true" class="animate-spin" />
  <span class="sr-only">{m.loading()}</span>
</div>
