<script lang="ts">
import CancelIcon from '@tabler/icons-svelte/icons/cancel';
import CircleCheckIcon from '@tabler/icons-svelte/icons/circle-check';
import CircleXIcon from '@tabler/icons-svelte/icons/circle-x';
import FileUploadIcon from '@tabler/icons-svelte/icons/file-upload';
import LanguageIcon from '@tabler/icons-svelte/icons/language';
import LoadingIcon from '@tabler/icons-svelte/icons/loader';

import { isEmpty } from 'radashi';
import { deserialize, enhance } from '$app/forms';
import { goto } from '$app/navigation';
import Required from '$lib/components/form/required.svelte';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '$lib/components/ui/accordion';
import { Button } from '$lib/components/ui/button';
import { m } from '$lib/paraglide/messages';

import PageEditorBase from './page-editor-base.svelte';
import PageEditorImage from './page-editor-image.svelte';
import PageEditorTranslatePortal from './page-editor-translate-portal.svelte';
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
let accordionOpening = $state('');
let saveDisabled = $derived(!(title && slug) || saving);
let translating = $state(false);
let translateStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');

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
    const res = await fetch('?/translate', {
      method: 'POST',
      body: form,
      headers: {
        'x-sveltekit-action': 'true',
        Accept: 'application/json'
      }
    });

    let body: any;
    try {
      body = await res.json();
    } catch {
      const text = await res.text();
      try {
        body = deserialize(text);
      } catch {
        body = null;
      }
    }

    const actionData = body?.data ?? body;
    if (body?.type === 'failure' || !res.ok || actionData?.error) {
      return null;
    }
    return actionData?.translations?.[0]?.translatedText ?? null;
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
  if (translating || !content || !selectedLang || selectedLang === 'en') {
    return;
  }

  translating = true;
  translateStatus = 'loading';
  errMsg = '';

  const form = new FormData();
  form.set('text', content);
  form.set('locales', JSON.stringify([selectedLang]));

  try {
    const res = await fetch('?/translate', {
      method: 'POST',
      body: form,
      headers: {
        'x-sveltekit-action': 'true',
        Accept: 'application/json'
      }
    });

    let body: any;
    try {
      body = await res.json();
    } catch {
      const text = await res.text();
      try {
        body = deserialize(text);
      } catch {
        body = null;
      }
    }

    const actionData = body?.data ?? body;

    if (body?.type === 'failure' || !res.ok || actionData?.error) {
      const err = actionData?.error ?? 'Translation failed';
      errMsg = typeof err === 'string' ? err : (err?.message ?? JSON.stringify(err));
      translateStatus = 'error';
      return;
    }

    if (actionData?.success && actionData?.translations) {
      await Promise.all([selectedLang].map((l) => translateLocaleFields(l, actionData.translations)));
      translateStatus = 'success';
    }

    if (actionData?.errors?.length) {
      errMsg = `${actionData.errors.length} locale(s) failed to translate`;
      translateStatus = 'error';
    }
  } catch (e) {
    errMsg = (e && typeof e === 'object' && (e as any).message) || 'Translation request failed';
    translateStatus = 'error';
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
    <!-- Language selector: restore dropdown UX to switch between variants -->
    <div class="flex items-center gap-2 mb-2">
      <label class="text-sm text-muted-foreground" for="page-editor-lang">Language:</label>
      <select
        class="form-select rounded-md border px-2 py-1"
        id="page-editor-lang"
        onchange={(e) => {
          const v = (e.target as HTMLSelectElement).value;
          selectedLang = v;
          if (typeof window !== 'undefined') {
            const el = document.getElementById(`variant-${v}`);
            if (el) {
              const btn = el.querySelector('button');
              if (btn instanceof HTMLButtonElement) {
                try {
                  btn.click();
                  btn.focus();
                } catch {
                  // ignore
                }
              }
              try {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } catch {
                // ignore
              }
            }
          }
        }}
        value={selectedLang}
      >
        {#each languages as l}
          <option selected={l.code === selectedLang} value={l.code}>{l.label}</option>
        {/each}
      </select>
      <Button class="ml-2" onclick={() => handleTranslate()} type="button" variant="outline">
        <LanguageIcon class="mr-1.5 size-4" />
        Translate selected
      </Button>
    </div>
    <Accordion type="multiple" value={languages.map((l) => l.code)}>
      <AccordionItem class="border-b-0" value="en">
        <AccordionTrigger class="hover:no-underline">
          <span class="font-semibold text-lg">{languages.find((l) => l.code === 'en')?.label || 'English'}</span>
        </AccordionTrigger>
        <AccordionContent>
          <div class="space-y-6 pt-4">
            <PageEditorBase bind:content bind:description bind:manualSlug bind:slug bind:title />
            <PageEditorImage bind:imageAlt bind:imageCaption bind:imageFile bind:imagePreview />
          </div>
        </AccordionContent>
      </AccordionItem>

      {#each languages.filter((l) => l.code !== 'en') as lang (lang.code)}
        <AccordionItem id={`variant-${lang.code}`} value={lang.code}>
          <div class="flex items-center justify-between">
            <AccordionTrigger class="hover:no-underline">
              <div class="flex items-center gap-3">
                <span class="font-semibold text-lg">{lang.label}</span>
              </div>
            </AccordionTrigger>
            {#if page?.id}
              <div class="translate-button-root" data-lang={lang.code}>
                <!-- Portal-mounted visual: keeps DOM valid while preserving layout -->
                <PageEditorTranslatePortal
                  {content}
                  langCode={lang.code}
                  onTranslate={(l) => {
                    selectedLang = l;
                    // open the requested variant accordion and run translate
                    // (best-effort DOM interaction in browser only)
                    if (typeof window !== 'undefined') {
                      const el = document.getElementById(`variant-${l}`);
                      if (el) {
                        const btn = el.querySelector('button');
                        if (btn instanceof HTMLButtonElement) {
                          btn.click();
                        }
                      }
                    }
                    handleTranslate();
                  }}
                  {selectedLang}
                  {translateStatus}
                  {translating}
                />
              </div>
            {/if}
          </div>
          <AccordionContent>
            <div class="pt-4 relative">
              {#if getVariant(lang.code)}
                <PageEditorVariant language={lang} variant={getVariant(lang.code)!} />
              {/if}
              <!-- visual-only positioning target preserved via CSS for translate button -->
              <div aria-hidden="true" class="absolute top-2 right-2 pointer-events-none">
                <!-- placeholder to reserve space so layout matches previous look -->
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      {/each}
    </Accordion>
  </div>

  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="ml-auto flex items-center gap-2">
      <Button onclick={() => goto('/admin/pages')} type="button" variant="outline">
        <CancelIcon class="mr-1.5 size-4" />{m.pageEditorCancel()}
      </Button>
      <Button disabled={saveDisabled} type="submit" variant="outline">
        <FileUploadIcon class="mr-1.5 size-4" />
        {saving ? m.pageEditorSaving() : 'Save'}
      </Button>
    </div>
  </div>
</form>
