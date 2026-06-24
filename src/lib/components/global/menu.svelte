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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="size-8 text-foreground">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-56">
          <DropdownMenu.Item onclick={() => goto('/account')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            Manage Account
          </DropdownMenu.Item>
          {#if user?.congregation}
            <DropdownMenu.Item onclick={() => goto('/edit?id=' + user?.congregation)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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
