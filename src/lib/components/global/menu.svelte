<script lang="ts">
import AbcIcon from '@tabler/icons-svelte/icons/abc';
import BuildingIcon from '@tabler/icons-svelte/icons/building';
import CirclePlusIcon from '@tabler/icons-svelte/icons/circle-plus';
import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
import FilesIcon from '@tabler/icons-svelte/icons/files';
import LogoutIcon from '@tabler/icons-svelte/icons/logout-2';
import MoonIcon from '@tabler/icons-svelte/icons/moon';
import PencilIcon from '@tabler/icons-svelte/icons/pencil';
import SunIcon from '@tabler/icons-svelte/icons/sun';
import UserCogIcon from '@tabler/icons-svelte/icons/user-cog';
import UsersIcon from '@tabler/icons-svelte/icons/users';
import { mode, toggleMode } from 'mode-watcher';
/* region imports */
import { createEventDispatcher } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { Button } from '$lib/components/ui/button';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as NativeSelect from '$lib/components/ui/native-select';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Sheet from '$lib/components/ui/sheet';
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
let open = $state(false);
let isMobile = $derived(appState.isMobile);
/* endregion variables */
</script>

<div
  class={viewMode === 'mini'
    ? 'mt-8 flex flex-col items-start justify-start'
    : 'flex flex-row items-center justify-between space-x-2'}
>
  {#if user?.congregation}
    <Button
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto(`/edit?id=${user?.congregation}`);
      }}
      variant={viewMode === 'mini' ? 'link' : 'default'}
    >
      <PencilIcon class="size-4" />
      {viewMode === 'full' && isMobile ? m.edit() : m.editCongregation()}
    </Button>
  {:else if user?.email}
    <Button
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto('/add');
      }}
      variant={viewMode === 'mini' ? 'link' : 'default'}
    >
      <CirclePlusIcon class="size-4" />
      {viewMode === 'full' && isMobile ? m.add() : m.addCongregation()}
    </Button>
  {:else}
    <Button
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto('/login?redirect=/add');
      }}
      variant={viewMode === 'mini' ? 'link' : 'default'}
    >
      <CirclePlusIcon class="size-4" />
      {m.addCongregation()}
    </Button>
  {/if}

  {#if user?.email}
    {#if viewMode === 'mini'}
      <!-- Mini mode: inline list -->
      <div class="flex flex-col items-start gap-1 px-4 py-2">
        <span class="text-muted-foreground text-xs font-semibold uppercase">{m.account()}</span>
        <button
          class="text-foreground text-sm underline-offset-4 hover:underline"
          onclick={() => { dispatch('close'); goto('/account'); }}
        >
          {m.manageAccount()}
        </button>
        {#if user?.congregation}
          <button
            class="text-foreground text-sm underline-offset-4 hover:underline"
            onclick={() => { dispatch('close'); goto('/edit?id=' + user?.congregation); }}
          >
            {m.editCongregation()}
          </button>
        {/if}
        {#if user?.admin}
          <span class="text-muted-foreground mt-2 text-xs font-semibold uppercase">{m.admin()}</span>
          <button
            class="text-foreground text-sm underline-offset-4 hover:underline"
            onclick={() => { dispatch('close'); goto('/admin'); }}
          >
            {m.dashboard()}
          </button>
          <button
            class="text-foreground text-sm underline-offset-4 hover:underline"
            onclick={() => { dispatch('close'); goto('/admin/congregations'); }}
          >
            {m.adminCongregations()}
          </button>
          <button
            class="text-foreground text-sm underline-offset-4 hover:underline"
            onclick={() => { dispatch('close'); goto('/admin/users'); }}
          >
            {m.adminUsers()}
          </button>
          <button
            class="text-foreground text-sm underline-offset-4 hover:underline"
            onclick={() => { dispatch('close'); goto('/admin/pages'); }}
          >
            {m.pages()}
          </button>
          <button
            class="text-foreground text-sm underline-offset-4 hover:underline"
            onclick={() => { dispatch('close'); goto('/admin/translations'); }}
          >
            {m.translations()}
          </button>
        {/if}
        <div class="mt-2 border-t pt-2">
          <div class="flex items-center gap-3 py-1">
            <Locale mode={viewMode} />
            <span class="flex items-center gap-1">
              <SunIcon class="size-3.5 text-muted-foreground" />
              <Switch
                aria-label={m.toggleDarkMode()}
                checked={mode.current === 'dark'}
                class="scale-75"
                onCheckedChange={toggleMode}
              />
              <MoonIcon class="size-3.5 text-muted-foreground" />
            </span>
          </div>
        </div>
        <button
          class="text-foreground text-sm underline-offset-4 hover:underline"
          onclick={() => { dispatch('close'); goto('/logout'); }}
        >
          {m.logout()}
        </button>
      </div>
    {:else}
      <!-- Sheet: slide-over nav menu (replaces old DropdownMenu) -->
      <Sheet.Root bind:open>
        <Sheet.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              aria-label={m.userMenu()}
              class="group flex size-8 items-center justify-center hover:bg-muted"
            >
              <div class="relative size-5">
                <span
                  class="absolute left-0 top-[2px] h-[2.5px] w-full rounded-full bg-foreground transition-all duration-300"
                  class:rotate-45={open}
                  class:top-[9px]={open}
                ></span>
                <span
                  class="absolute left-0 top-[9px] h-[2.5px] w-full rounded-full bg-foreground transition-all duration-300"
                  class:opacity-0={open}
                ></span>
                <span
                  class="absolute bottom-[2px] left-0 h-[2.5px] w-full rounded-full bg-foreground transition-all duration-300"
                  class:-rotate-45={open}
                  class:top-[9px]={open}
                ></span>
              </div>
            </button>
          {/snippet}
        </Sheet.Trigger>
        <Sheet.Content class="w-72 max-sm:w-full" side="left" showCloseButton={false}>
          <div class="flex flex-col gap-4 px-4 py-6 pt-16">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground text-xs max-sm:text-sm">Language</span>
              <NativeSelect.Root
                onchange={async () => {
                await fetch('/user/lang', { method: 'POST', body: JSON.stringify({ lang, user: page.data.user?.id }) });
                setLocale(lang as Parameters<typeof setLocale>[0], { reload: true });
              }}
                bind:value={lang}
              >
                <NativeSelect.Option value="en">English</NativeSelect.Option>
                <NativeSelect.Option value="de">Deutsch</NativeSelect.Option>
                <NativeSelect.Option value="es">Español</NativeSelect.Option>
                <NativeSelect.Option value="fr">Français</NativeSelect.Option>
                <NativeSelect.Option value="he">עברית</NativeSelect.Option>
                <NativeSelect.Option value="hu">Magyar</NativeSelect.Option>
                <NativeSelect.Option value="nl">Nederlands</NativeSelect.Option>
                <NativeSelect.Option value="pl">Polski</NativeSelect.Option>
                <NativeSelect.Option value="pt">Português</NativeSelect.Option>
                <NativeSelect.Option value="ru">Русский</NativeSelect.Option>
                <NativeSelect.Option value="uk">Українська</NativeSelect.Option>
              </NativeSelect.Root>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground text-xs max-sm:text-sm">{m.darkMode()}</span>
              <div class="flex items-center gap-2">
                {#if mode.current === 'dark'}
                  <MoonIcon class="size-4 text-muted-foreground max-sm:size-5" />
                {:else}
                  <SunIcon class="size-4 text-muted-foreground max-sm:size-5" />
                {/if}
                <Switch
                  aria-label={m.toggleDarkMode()}
                  checked={mode.current === 'dark'}
                  onCheckedChange={toggleMode}
                />
              </div>
            </div>
            <hr class="border-border" />
            {#if user?.admin}
              <span class="text-muted-foreground text-xs font-semibold uppercase max-sm:text-sm">{m.admin()}</span>
              <button
                class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
                onclick={() => { open = false; goto('/admin'); }}
              >
                <DashboardIcon class="size-4 max-sm:size-5" />
                {m.dashboard()}
              </button>
              <button
                class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
                onclick={() => { open = false; goto('/admin/congregations'); }}
              >
                <BuildingIcon class="size-4 max-sm:size-5" />
                {m.adminCongregations()}
              </button>
              <button
                class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
                onclick={() => { open = false; goto('/admin/users'); }}
              >
                <UsersIcon class="size-4 max-sm:size-5" />
                {m.adminUsers()}
              </button>
              <button
                class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
                onclick={() => { open = false; goto('/admin/pages'); }}
              >
                <FilesIcon class="size-4 max-sm:size-5" />
                {m.pages()}
              </button>
              <button
                class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
                onclick={() => { open = false; goto('/admin/translations'); }}
              >
                <AbcIcon class="size-4 max-sm:size-5" />
                Text
              </button>
              <hr class="border-border" />
            {/if}
            <button
              class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
              onclick={() => { open = false; goto('/account'); }}
            >
              <UserCogIcon class="size-4 max-sm:size-5" />
              {m.manageAccount()}
            </button>
            <button
              class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
              onclick={() => { open = false; goto('/logout'); }}
            >
              <LogoutIcon class="size-4 max-sm:size-5" />
              {m.logout()}
            </button>
          </div>
        </Sheet.Content>
      </Sheet.Root>
    {/if}
  {:else}
    <Button
      class={viewMode === 'mini' ? 'text-foreground' : ''}
      onclick={async () => {
        dispatch('close');
        await goto('/login?login');
      }}
      variant={viewMode === 'mini' ? 'link' : 'outline'}
    >
      {m.login()}
    </Button>
  {/if}

  {#if !user?.email}
    <Locale mode={viewMode} />
    <div class="flex flex-row items-center justify-start space-x-2 {viewMode === 'mini' ? 'mt-4 w-full px-4' : ''}">
      <span class="flex flex-row items-center justify-start space-x-1">
        <SunIcon class="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:hover:rotate-90" />
        <Switch aria-label={m.toggleDarkMode()} checked={mode.current === 'dark'} onCheckedChange={toggleMode} />
        <MoonIcon class="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:hover:rotate-90" />
      </span>
    </div>
  {/if}
</div>
