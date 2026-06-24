<script lang="ts">
  import MoonIcon from '@tabler/icons-svelte/icons/moon';
  import SunIcon from '@tabler/icons-svelte/icons/sun';
  import { mode, toggleMode } from 'mode-watcher';
  /* region imports */
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
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
      {#if viewMode === 'mini'}
        <!-- Mini mode: simple link list -->
        <div class="flex flex-col items-start gap-1 px-4 py-2">
          <span class="text-muted-foreground text-xs font-semibold uppercase">Admin</span>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin'); }}>Dashboard</button>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin/congregations'); }}>Congregations</button>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin/approvals'); }}>Approvals</button>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin/users'); }}>Users</button>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin/pages'); }}>Pages</button>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin/settings'); }}>Settings</button>
        </div>
      {:else}
        <!-- Full mode: dropdown menu -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="outline">Admin</Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onclick={() => goto('/admin')}>Dashboard</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/congregations')}>Congregations</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/approvals')}>Approvals</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/users')}>Users</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/pages')}>Pages</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/settings')}>Settings</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
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
