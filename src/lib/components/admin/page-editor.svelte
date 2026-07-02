<script lang="ts">
import { isEmpty } from 'radashi';
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import Required from '$lib/components/form/required.svelte';
import { Button } from '$lib/components/ui/button';
import { m } from '$lib/paraglide/messages';

import PageEditorBase from './page-editor-base.svelte';
import PageEditorImage from './page-editor-image.svelte';
import PageEditorVariant from './page-editor-variant.svelte';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'he', label: 'עברית' },
  { code: 'hu', label: 'Magyar' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' }
];

interface Variant {
  content: string;
  description: string;
  id?: string;
  imageAlt: string;
  imageCaption: string;
  language: string;
  title: string;
}

let {
  page = null,
  saving = $bindable(false),
  action = '?/save',
  onSuccess = () => goto('/admin/pages')
}: {
  page?: Record<string, unknown> | null;
  saving?: boolean;
  action?: string;
  onSuccess?: () => void;
} = $props();

// svelte-ignore state_referenced_locally
const initialPage = page;
let title = $state((initialPage?.title as string) ?? '');
let slug = $state((initialPage?.slug as string) ?? '');
let description = $state((initialPage?.description as string) ?? '');
let content = $state((initialPage?.content as string) ?? '');
let imageAlt = $state((initialPage?.imageAlt as string) ?? '');
let imageCaption = $state((initialPage?.imageCaption as string) ?? '');
let manualSlug = $state(!!initialPage);
let errMsg = $state('');

let variants = $state<Variant[]>(
  languages
    .filter((l) => l.code !== 'en')
    .map((lang) => ({
      language: lang.code,
      title: '',
      description: '',
      content: '',
      imageAlt: '',
      imageCaption: ''
    }))
);
let imageFile = $state<File | null>(null);
let imagePreview = $state((initialPage?.image as string) ?? '');
// biome-ignore lint/suspicious/noUnassignedVariables: assigned via Svelte bind:this
let variantsInput: HTMLInputElement;

let selectedLang = $state('en');
let saveDisabled = $derived(!(title && slug) || saving);
let translating = $state(false);

function getVariant(lang: string): Variant | undefined {
  return variants.find((v) => v.language === lang);
}

function handleEnhance() {
  saving = true;
  errMsg = '';
  return ({ result }: { result: { type: string; data?: Record<string, unknown> } }) => {
    saving = false;
    if (result.type === 'success' || result.type === 'redirect') {
      onSuccess();
    } else {
      errMsg = (result.data?.error as string) ?? m.pageEditorSaveFailed();
    }
  };
}

function beforeSubmit() {
  const vars = variants
    .filter((v) => v.title || v.description || v.content || v.imageAlt || v.imageCaption)
    .map((v) => ({
      id: v.id,
      language: v.language,
      title: v.title,
      description: v.description,
      content: v.content,
      imageAlt: v.imageAlt,
      imageCaption: v.imageCaption
    }));
  variantsInput.value = JSON.stringify(vars);
}

async function translateField(text: string, locale: string): Promise<string | null> {
  if (!text) {
    return null;
  }
  const form = new FormData();
  form.set('text', text);
  form.set('locales', JSON.stringify([locale]));
  try {
    const res = await fetch('?/translate', { method: 'POST', body: form });
    const body = await res.json();
    const data = body?.data ?? body;
    return data?.translations?.[0]?.translatedText ?? null;
  } catch {
    return null;
  }
}

async function translateLocaleFields(
  locale: string,
  contentTranslations: Array<{ locale: string; translatedText: string }>
) {
  const [titleT, descT, altT, captionT] = await Promise.all([
    translateField(title, locale),
    translateField(description, locale),
    translateField(imageAlt, locale),
    translateField(imageCaption, locale)
  ]);

  const variant = variants.find((v) => v.language === locale);
  if (!variant) {
    return;
  }

  const contentT = contentTranslations.find((t) => t.locale === locale);
  if (contentT) {
    variant.content = contentT.translatedText;
  }
  if (titleT) {
    variant.title = titleT;
  }
  if (descT) {
    variant.description = descT;
  }
  if (altT) {
    variant.imageAlt = altT;
  }
  if (captionT) {
    variant.imageCaption = captionT;
  }
}

async function handleTranslate() {
  if (translating || !content) {
    return;
  }

  translating = true;
  const nonEnglishLocales = languages.filter((l) => l.code !== 'en').map((l) => l.code);

  const form = new FormData();
  form.set('text', content);
  form.set('locales', JSON.stringify(nonEnglishLocales));

  try {
    const res = await fetch('?/translate', { method: 'POST', body: form });
    const body = await res.json();
    const actionData = body?.data ?? body;

    if (body?.type === 'failure' || !res.ok || actionData?.error) {
      errMsg = actionData?.error ?? 'Translation failed';
      return;
    }

    if (actionData?.success && actionData?.translations) {
      await Promise.all(nonEnglishLocales.map((l) => translateLocaleFields(l, actionData.translations)));
    }

    if (actionData?.errors?.length) {
      errMsg = `${actionData.errors.length} locale(s) failed to translate`;
    }
  } catch {
    errMsg = 'Translation request failed';
  } finally {
    translating = false;
  }
}
</script>

{#if errMsg}
  <div class="bg-destructive/10 text-destructive rounded-lg border p-4 text-sm mb-4">{errMsg}</div>
{/if}

<form {action} class="space-y-6" method="POST" onsubmit={beforeSubmit} use:enhance={handleEnhance}>
  <input name="variants" type="hidden" value="" bind:this={variantsInput} />
  {#if page?.id}
    <input name="id" type="hidden" value={page.id as string} />
  {/if}

  <div class="relative space-y-6">
    {#if page?.id}
      <div class="absolute right-4 top-4 z-10">
        <select
          class="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          bind:value={selectedLang}
        >
          {#each languages as lang (lang.code)}
            <option value={lang.code}>{lang.label}</option>
          {/each}
        </select>
      </div>
    {/if}

    {#if selectedLang === 'en'}
      <PageEditorBase bind:content bind:description bind:manualSlug bind:slug bind:title />
      <PageEditorImage bind:imageAlt bind:imageCaption bind:imageFile bind:imagePreview />
    {:else}
      {@const v = getVariant(selectedLang)}
      {#if v}
        <PageEditorVariant language={languages.find((l) => l.code === selectedLang) ?? languages[0]} variant={v} />
      {/if}
    {/if}
  </div>

  <div class="flex gap-2">
    <Button disabled={saveDisabled} type="submit">
      {saving ? m.pageEditorSaving() : page?.id ? m.pageEditorUpdatePage() : m.pageEditorCreatePage()}
    </Button>
    <Button disabled={translating || !content} onclick={handleTranslate} type="button" variant="secondary">
      {translating ? 'Translating…' : 'Translate from English'}
    </Button>
    <Button onclick={() => goto('/admin/pages')} type="button" variant="outline">{m.pageEditorCancel()}</Button>
  </div>
</form>
