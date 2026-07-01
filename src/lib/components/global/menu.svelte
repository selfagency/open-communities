<script lang="ts">
import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
import FilesIcon from '@tabler/icons-svelte/icons/files';
import LanguageIcon from '@tabler/icons-svelte/icons/language';
import Login2Icon from '@tabler/icons-svelte/icons/login-2';
import LogoutIcon from '@tabler/icons-svelte/icons/logout-2';
import MoonIcon from '@tabler/icons-svelte/icons/moon';
import PlusIcon from '@tabler/icons-svelte/icons/plus';
import SunIcon from '@tabler/icons-svelte/icons/sun';
import UserCogIcon from '@tabler/icons-svelte/icons/user-cog';
import UsersIcon from '@tabler/icons-svelte/icons/users';
import UsersGroupIcon from '@tabler/icons-svelte/icons/users-group';
import { mode, toggleMode } from 'mode-watcher';
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

let { mode: viewMode = $bindable('full') }: { mode?: 'full' | 'mini' } = $props();

const user = $derived(page.data.user);
let lang = $state(page.data.lang ?? 'en');
let open = $state(false);
const isMobile = $derived(appState.isMobile);
</script>

<Sheet.Root bind:open>
  <Sheet.Trigger onclick={(e) => { e.preventDefault(); open = !open; }}>
    {#snippet child({ props })}
      <button {...props} aria-label={m.userMenu()} class="group flex size-8 items-center justify-center hover:bg-muted">
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
  <Sheet.Content class="w-72 pt-18 max-sm:w-full" preventScroll={false} showCloseButton={false} side="right">
    <div class="flex flex-col gap-4 px-4 py-6">
      <!-- Language + Theme -->
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
          <Switch aria-label={m.toggleDarkMode()} checked={mode.current === 'dark'} onCheckedChange={toggleMode} />
        </div>
      </div>
      <hr class="border-border" />

      <!-- Logged-in links -->
      {#if user?.email}
        {#if user?.admin}
          <span class="text-muted-foreground text-xs font-semibold uppercase max-sm:text-sm">{m.admin()}</span>
          <button
            class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
            onclick={async () => { open = false; await goto('/admin'); }}
          >
            <DashboardIcon class="size-4 max-sm:size-5" />
            {m.dashboard()}
          </button>
          <button
            class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
            onclick={async () => { open = false; await goto('/admin/congregations'); }}
          >
            <UsersGroupIcon class="size-4 max-sm:size-5" />
            {m.adminCongregations()}
          </button>
          <button
            class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
            onclick={async () => { open = false; await goto('/admin/users'); }}
          >
            <UsersIcon class="size-4 max-sm:size-5" />
            {m.adminUsers()}
          </button>
          <button
            class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
            onclick={async () => { open = false; await goto('/admin/pages'); }}
          >
            <FilesIcon class="size-4 max-sm:size-5" />
            {m.pages()}
          </button>
          <button
            class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
            onclick={async () => { open = false; await goto('/admin/translations'); }}
          >
            <LanguageIcon class="size-4 max-sm:size-5" />
            {m.translations()}
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
      {:else}
        <!-- Anon: add congregation first, then login -->
        <a
          class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
          href="/login?redirect=/add"
          onclick={() => { open = false; }}
        >
          <PlusIcon class="size-4 max-sm:size-5" />
          {m.addCongregation()}
        </a>
        <a
          class="text-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline max-sm:py-2"
          href="/login?login"
          onclick={() => { open = false; }}
        >
          <Login2Icon class="size-4 max-sm:size-5" />
          {m.login()}
        </a>
      {/if}

      <hr class="border-border" />

      <!-- Footer links -->
      <div class="flex flex-col gap-2">
        <a
          class="text-foreground text-sm underline-offset-4 hover:underline max-sm:py-2"
          href="/about"
          onclick={() => { open = false; }}
        >
          {m.about()}
        </a>
        <a
          class="text-foreground text-sm underline-offset-4 hover:underline max-sm:py-2"
          href="/contact"
          onclick={() => { open = false; }}
        >
          {m.contact_contactUs()}
        </a>
      </div>
      <div class="flex flex-col gap-1">
        <a
          class="text-muted-foreground text-xs underline-offset-4 hover:underline max-sm:py-1"
          href="/privacy"
          onclick={() => { open = false; }}
        >
          {m.privacyPolicy()}
        </a>
        <a
          class="text-muted-foreground text-xs underline-offset-4 hover:underline max-sm:py-1"
          href="/terms"
          onclick={() => { open = false; }}
        >
          {m.termsOfService()}
        </a>
      </div>
    </div>
  </Sheet.Content>
</Sheet.Root>
