<script lang="ts">
  import MoonIcon from '@tabler/icons-svelte/icons/moon';
  import SunIcon from '@tabler/icons-svelte/icons/sun';
  import UserCircleIcon from '@tabler/icons-svelte/icons/user-circle';
  import PencilIcon from '@tabler/icons-svelte/icons/pencil';
  import LogoutIcon from '@tabler/icons-svelte/icons/logout';
  import { mode, toggleMode } from 'mode-watcher';
  /* region imports */
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Switch } from '$lib/components/ui/switch';
  import { m } from '$lib/paraglide/messages';
  import { setLocale } from '$lib/paraglide/runtime';
  import { state as appState } from '$lib/stores';

  import Locale from './locale.svelte';

  /*  endregion imports */

  /* region variables */
  // props
  let { mode: viewMode = $bindable('full') }: { mode?: 'full' | 'mini' } = $props();

  // constants
  const dispatch = createEventDispatcher();
  const user = $derived(page.data.user);
  let lang = $state(page.data.lang ?? 'en');
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
  {:else if user?.email}
    <Button
      variant={viewMode === 'mini' ? 'link' : 'default'}
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto('/add');
      }}>
      {viewMode === 'full' && isMobile ? m.add() : m.addCongregation()}
    </Button>
  {:else}
    <Button
      variant={viewMode === 'mini' ? 'link' : 'default'}
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto('/login?redirect=/add');
      }}>
      {m.addCongregation()}
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
          <div class="flex items-center gap-3 py-1">
            <Locale mode={viewMode} />
            <span class="flex items-center gap-1">
              <SunIcon class="size-3.5 text-muted-foreground" />
              <Switch checked={mode.current === 'dark'} onCheckedChange={toggleMode} aria-label="Toggle dark mode" class="scale-75" />
              <MoonIcon class="size-3.5 text-muted-foreground" />
            </span>
          </div>
        </div>
        <button class="text-foreground text-sm underline-offset-4 hover:underline" onclick={() => { dispatch('close'); goto('/logout'); }}>Log out</button>
      </div>
    {:else}
      <!-- Full mode: user circle dropdown -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <button class="flex size-8 items-center justify-center rounded-full bg-background hover:bg-muted" aria-label="User menu">
            <UserCircleIcon class="size-8 text-foreground" style="stroke-width: 1.25" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-56">
          <DropdownMenu.Item onclick={() => goto('/account')}>
            <UserCircleIcon class="mr-2 size-4" />
            Manage Account
          </DropdownMenu.Item>
          {#if user?.congregation}
            <DropdownMenu.Item onclick={() => goto('/edit?id=' + user?.congregation)}>
              <PencilIcon class="mr-2 size-4" />
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
          <DropdownMenu.Label class="text-muted-foreground text-xs">Language</DropdownMenu.Label>
          <div class="grid grid-cols-3 gap-1 px-2 py-1">
            {#each [{l:'English',v:'en'},{l:'Español',v:'es'},{l:'Français',v:'fr'},{l:'עברית',v:'he'},{l:'Deutsch',v:'de'},{l:'Magyar',v:'hu'},{l:'Português',v:'pt'},{l:'Русский',v:'ru'},{l:'Українська',v:'uk'}] as {l,v}}
              <button
                class="rounded-md px-2 py-1 text-xs font-medium transition-colors {lang === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}"
                onclick={async () => {
                  lang = v;
                  await fetch('/user/lang', { method: 'POST', body: JSON.stringify({ lang: v, user: page.data.user?.id }) });
                  setLocale(v as Parameters<typeof setLocale>[0], { reload: true });
                }}
              >{v.toUpperCase()}</button>
            {/each}
          </div>
          <DropdownMenu.Separator />
          <div class="flex items-center justify-between px-2 py-1.5">
            <span class="text-muted-foreground text-xs">Dark mode</span>
            <Switch checked={mode.current === 'dark'} onCheckedChange={toggleMode} aria-label="Toggle dark mode" />
          </div>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={() => goto('/logout')}>
            <LogoutIcon class="mr-2 size-4" />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  {:else}
    <Button
      variant={viewMode === 'mini' ? 'link' : 'outline'}
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto('/login?login');
      }}>
      {m.login()}
    </Button>
  {/if}

  {#if !user?.email}
    <Locale mode={viewMode} />
    <div class="flex flex-row items-center justify-start space-x-2 {viewMode === 'mini' ? 'mt-4 w-full px-4' : ''}">
      <span class="flex flex-row items-center justify-start space-x-1">
        <SunIcon class="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:hover:rotate-90" />
        <Switch checked={mode.current === 'dark'} onCheckedChange={toggleMode} aria-label="Toggle dark mode" />
        <MoonIcon class="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:hover:rotate-90" />
      </span>
    </div>
  {/if}
</div>
