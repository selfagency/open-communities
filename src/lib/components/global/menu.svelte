<script lang="ts">
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SunIcon from '@lucide/svelte/icons/sun';
  import { mode, toggleMode } from 'mode-watcher';
  /* region imports */
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Switch } from '$lib/components/ui/switch';
  import { m } from '$lib/paraglide/messages';
  import { state as appState } from '$lib/stores';

  import Locale from './locale.svelte';

  /*  endregion imports */

  /* region variables */
  // props
  let { mode: viewMode = $bindable('full') }: { mode?: 'full' | 'mini' } = $props();

  // constants
  const dispatch = createEventDispatcher();
  const user = $derived(page.data.user);
  let isMobile = $derived(appState.isMobile);
  /* endregion variables */
</script>

<div
  class={viewMode === 'mini'
    ? 'mt-8 flex flex-col items-start justify-start'
    : 'flex flex-row items-center justify-between space-x-2'}>
  {#if user?.congregation && !user?.admin}
    <Button
      variant={viewMode === 'mini' ? 'link' : 'default'}
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto(`/edit?id=${user?.congregation}`);
      }}>
      {viewMode === 'full' && isMobile ? m.edit() : m.editCongregation()}
    </Button>
  {:else}
    <Button
      variant={viewMode === 'mini' ? 'link' : 'default'}
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto('/add');
      }}>
      {viewMode === 'full' && isMobile ? m.add() : m.addCongregation()}
    </Button>
  {/if}

  {#if user?.email}
    {#if user?.admin}
      <Button
        variant={viewMode === 'mini' ? 'link' : 'outline'}
        class={viewMode === 'mini' ? 'text-foreground' : ''}
        onclick={async () => {
          dispatch('close');
          await goto('/admin');
        }}>
        {m.admin()}
      </Button>
    {/if}
    <Button
      variant={viewMode === 'mini' ? 'link' : 'outline'}
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto('/logout');
      }}>
      {m.logout()}
    </Button>
  {:else}
    <Button
      variant={viewMode === 'mini' ? 'link' : 'outline'}
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto('/login');
      }}>
      {m.login()}
      {viewMode === 'full' && isMobile ? '' : `/ ${m.signUp()}`}
    </Button>
  {/if}

  <Locale mode={viewMode} />
  <div class="flex flex-row items-center justify-start space-x-2 {viewMode === 'mini' ? 'mt-4 w-full px-4' : ''}">
    <span class="flex flex-row items-center justify-start space-x-1">
      <SunIcon class="h-4 w-4 text-muted-foreground" />
      <Switch checked={mode.current === 'dark'} onCheckedChange={toggleMode} aria-label="Toggle dark mode" />
      <MoonIcon class="h-4 w-4 text-muted-foreground" />
    </span>
  </div>
</div>
