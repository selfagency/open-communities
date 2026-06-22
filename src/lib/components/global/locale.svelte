<script lang="ts">
  /* region imports */
  import LocaleIcon from 'lucide-svelte/icons/languages';
  import { onMount, tick } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { Badge } from '$lib/components/ui/badge';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { m } from '$lib/paraglide/messages';
  import { setLocale } from '$lib/paraglide/runtime';
  import type { UsersLangOptions } from '$lib/pocketbase.d';
  import { log } from '$lib/utils';

  /*  endregion imports */

  /* region variables */
  // props
  let { mode = $bindable('full') }: { mode?: 'full' | 'mini' } = $props();

  // constants
  const locales = [
    { label: 'Deutsch', value: 'de' },
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' },
    { label: 'Français', value: 'fr' },
    { label: 'עברית', value: 'he' },
    { label: 'Magyar', value: 'hu' },
    { label: 'Português', value: 'pt' },
    { label: 'Русский', value: 'ru' },
    { label: 'Українська', value: 'uk' }
  ];

  // locals
  let lang = $state('en' as UsersLangOptions);

  const serverLang = $derived(page.data.lang);
  /* endregion variables */

  /* region lifecycle */
  onMount(async () => {
    await tick();
    lang = serverLang;
  });

  /* region methods */
  async function updateLang() {
    try {
      const res = await fetch('/user/lang', {
        body: JSON.stringify({ lang, user: page.data.user?.id }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(err.error || 'Failed to update language');
        // Revert lang to server value on failure
        lang = serverLang;
        return;
      }

      invalidateAll();
      setLocale(lang, { reload: true });
      toast.success(m.languageChanged());
    } catch (error) {
      log.error('failed to update user language', error);
      toast.error('Network error updating language');
      lang = serverLang;
    }
  }

  /* endregion methods */
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="button {mode === 'mini' ? 'link' : 'ghost'} flex flex-row items-center justify-start space-x-1">
    {@const locale = locales.find((f) => f.value === lang)?.label}
    <LocaleIcon class="h-4 w-4 text-slate-500" />
    <span>{locale}</span>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-56">
    <DropdownMenu.Label>{m.language()}</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.RadioGroup bind:value={lang} onValueChange={() => updateLang()}>
      {#each locales as { label, value }, i (i)}
        <DropdownMenu.RadioItem {value} class="flex flex-row items-center justify-start space-x-2">
          <Badge variant="outline" class="text-xs font-normal">{value.toUpperCase()}</Badge>
          <span>{label}</span>
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
