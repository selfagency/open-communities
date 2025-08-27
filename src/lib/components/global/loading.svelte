<script lang="ts">
  import Loading from 'lucide-svelte/icons/loader-circle';
  const { class: className = '', variant = 'default' }: { class?: string; variant?: 'default' | 'full' } = $props();
  import { fade } from 'svelte/transition';
</script>

<div
  class:min-h-[50vh]={variant === 'full'}
  class={`my-4 flex h-full w-full flex-col items-center justify-center ${className}`}
  in:fade={{ duration: 300 }}
  out:fade={{ duration: 300 }}>
  <Loading class="animate-spin" />
</div>
