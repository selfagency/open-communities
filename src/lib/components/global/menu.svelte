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
    {#if viewMode === 'mini'}
      <!-- Mini mode: inline list -->
      <div class="flex flex-col items-start gap-1 px-4 py-2">
        <span class="text-muted-foreground text-xs font-semibold uppercase">Account</span>
        <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/account'); }}>Manage Account</button>
        {#if user?.congregation}
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/edit?id=' + user?.congregation); }}>Edit Congregation</button>
        {/if}
        {#if user?.admin}
          <span class="text-muted-foreground mt-2 text-xs font-semibold uppercase">Admin</span>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin'); }}>Dashboard</button>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin/congregations'); }}>Congregations</button>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin/users'); }}>Users</button>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin/pages'); }}>Pages</button>
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/admin/settings'); }}>Settings</button>
        {/if}
        <div class="mt-2 border-t pt-2">
          <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/logout'); }}>Log out</button>
        </div>
      </div>
    {:else}
      <!-- Full mode: user circle dropdown -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <button class="flex size-8 items-center justify-center rounded-full hover:bg-muted" aria-label="User menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-foreground">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-56">
          <DropdownMenu.Item onclick={() => goto('/account')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            Manage Account
          </DropdownMenu.Item>
          {#if user?.congregation}
            <DropdownMenu.Item onclick={() => goto('/edit?id=' + user?.congregation)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Congregation
            </DropdownMenu.Item>
          {/if}
          {#if user?.admin}
            <DropdownMenu.Separator />
            <DropdownMenu.Label class="text-muted-foreground text-xs">Admin</DropdownMenu.Label>
            <DropdownMenu.Item onclick={() => goto('/admin')}>Dashboard</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/congregations')}>Congregations</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/users')}>Users</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/pages')}>Pages</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/settings')}>Settings</DropdownMenu.Item>
          {/if}
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={() => goto('/logout')}>Log out</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
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
      <SunIcon class="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:hover:rotate-90" />
      <Switch checked={mode.current === 'dark'} onCheckedChange={toggleMode} aria-label="Toggle dark mode" />
      <MoonIcon class="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:hover:rotate-90" />
    </span>
  </div>
</div>
