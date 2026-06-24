<script lang="ts">
  /* region imports */
  import LocaleIcon from "@tabler/icons-svelte/icons/language";
  import { onMount, tick } from "svelte";
  import { toast } from "svelte-sonner";
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import { Badge } from "$lib/components/ui/badge";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { m } from "$lib/paraglide/messages";
  import { setLocale } from "$lib/paraglide/runtime";
  import type { UsersLangOptions } from "$lib/pocketbase.d";
  import { log } from "$lib/utils";

  /*  endregion imports */

  /* region variables */
  // props
  let { mode = $bindable("full") }: { mode?: "full" | "mini" } = $props();

  // constants
  const locales = [
    { label: "Deutsch", value: "de" },
    { label: "English", value: "en" },
    { label: "Español", value: "es" },
    { label: "Français", value: "fr" },
    { label: "עברית", value: "he" },
    { label: "Magyar", value: "hu" },
    { label: "Português", value: "pt" },
    { label: "Русский", value: "ru" },
    { label: "Українська", value: "uk" },
  ];

  const buttonClass = "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 h-11 px-4 py-2 has-[>svg]:px-3 bg-background shadow-xs hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border"

  // locals
  let lang = $state("en" as UsersLangOptions);

  const code = $derived(lang?.toUpperCase() ?? '');

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
      // Only reload if the locale actually changed — prevents reload loop
      const currentLocale = page.data.lang || "en";
      if (lang === currentLocale) return;

      const res = await fetch("/user/lang", {
        body: JSON.stringify({ lang, user: page.data.user?.id }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        toast.error(err.error || "Failed to update language");
        // Revert lang to server value on failure
        lang = serverLang;
        return;
      }

      invalidateAll();
      setLocale(lang, { reload: true });
      toast.success(m.languageChanged());
    } catch (error) {
      log.error("failed to update user language", error);
      toast.error("Network error updating language");
      lang = serverLang;
    }
  }

  /* endregion methods */
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger aria-label={m.selectLanguage()} class={mode === 'mini' ? 'text-foreground underline-offset-4 hover:underline inline-flex items-center gap-2 px-4 py-2 text-sm' : buttonClass}
  >
    <LocaleIcon class="h-4 w-4 {mode === 'mini' ? 'text-foreground' : 'stroke-muted-foreground'}" />
      <span class={(mode === "mini" ? "text-foreground" : "max-[720px]:hidden text-muted-foreground")} aria-hidden="true">{code}</span>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-56">
    <DropdownMenu.Label>{m.language()}</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.RadioGroup
      bind:value={lang}
      onValueChange={() => updateLang()}
    >
      {#each locales as { label, value }, i (i)}
        <DropdownMenu.RadioItem
          {value}
          class="flex flex-row items-center justify-start space-x-2"
        >
          <Badge variant="outline" class="text-xs font-normal"
            >{value.toUpperCase()}</Badge
          >
          <span lang={value}>{label}</span>
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
