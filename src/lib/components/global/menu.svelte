<script lang="ts">
import AbcIcon from '@tabler/icons-svelte/icons/abc';
import BuildingIcon from '@tabler/icons-svelte/icons/building';
import CirclePlusIcon from '@tabler/icons-svelte/icons/circle-plus';
import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
import FilesIcon from '@tabler/icons-svelte/icons/files';
import LogoutIcon from '@tabler/icons-svelte/icons/logout-2';
import MenuIcon from '@tabler/icons-svelte/icons/menu';
import MoonIcon from '@tabler/icons-svelte/icons/moon';
import XIcon from '@tabler/icons-svelte/icons/x';
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
import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as NativeSelect from '$lib/components/ui/native-select';
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
      <!-- Full mode: user dropdown -->
      <DropdownMenu.Root bind:open>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              aria-label={m.userMenu()}
              class="flex size-8 items-center justify-center hover:bg-muted"
            >
              {#if open}
                <XIcon class="size-6 text-foreground" />
              {:else}
                <MenuIcon class="size-6 text-foreground" />
              {/if}
            </button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-56 max-sm:w-72">
          <div class="flex items-center justify-between px-2 py-1.5 max-sm:py-3">
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
          <div class="flex items-center justify-between px-2 py-1.5 max-sm:py-3">
            <span class="text-muted-foreground text-xs max-sm:text-sm">{m.darkMode()}</span>
            <div class="flex items-center gap-2">
              {#if mode.current === 'dark'}
                <MoonIcon class="size-4 text-muted-foreground max-sm:size-5" />
              {:else}
                <SunIcon class="size-4 text-muted-foreground max-sm:size-5" />
              {/if}
              <Switch aria-label={m.toggleDarkMode()} checked={mode.current === 'dark'} onCheckedChange={toggleMode} />
            </div>
          </div>
          {#if user?.admin}
            <DropdownMenu.Separator />
            <DropdownMenu.Label class="text-muted-foreground text-xs max-sm:text-sm">{m.admin()}</DropdownMenu.Label>
            <DropdownMenu.Item onclick={() => goto('/admin')} class="max-sm:py-3 max-sm:text-base">
              <DashboardIcon class="mr-2 size-4 max-sm:size-5" />
              {m.dashboard()}
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/congregations')} class="max-sm:py-3 max-sm:text-base">
              <BuildingIcon class="mr-2 size-4 max-sm:size-5" />
              {m.adminCongregations()}
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/users')} class="max-sm:py-3 max-sm:text-base">
              <UsersIcon class="mr-2 size-4 max-sm:size-5" />
              {m.adminUsers()}
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/pages')} class="max-sm:py-3 max-sm:text-base">
              <FilesIcon class="mr-2 size-4 max-sm:size-5" />
              {m.pages()}
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto('/admin/translations')} class="max-sm:py-3 max-sm:text-base">
              <AbcIcon class="mr-2 size-4 max-sm:size-5" />
              Text
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
          {/if}
          <DropdownMenu.Item onclick={() => goto('/account')} class="max-sm:py-3 max-sm:text-base">
            <UserCogIcon class="mr-2 size-4 max-sm:size-5" />
            {m.manageAccount()}
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => goto('/logout')} class="max-sm:py-3 max-sm:text-base">
            <LogoutIcon class="mr-2 size-4 max-sm:size-5" />
            {m.logout()}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
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
