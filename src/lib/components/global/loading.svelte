<script lang="ts">
import Loading from '@tabler/icons-svelte/icons/loader';
import { m } from '$lib/paraglide/messages';

const { class: className = '', variant = 'default' }: { class?: string; variant?: 'default' | 'full' } = $props();

import { fade } from 'svelte/transition';
</script>

<div
  class:min-h-[50vh]={variant === "full"}
  class={`my-4 flex h-full w-full flex-col items-center justify-center ${className}`}
  role="status"
  aria-label={m.loading()}
  in:fade={{ duration: 300 }}
  out:fade={{ duration: 300 }}
>
  <Loading class="animate-spin" aria-hidden="true" />
  <span class="sr-only">{m.loading()}</span>
</div>
