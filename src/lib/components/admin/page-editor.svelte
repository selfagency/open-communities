<script lang="ts">
import { isEmpty } from 'radashi';
import stopwordsAll from 'stopwords-iso';
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import Required from '$lib/components/form/required.svelte';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as FileDropZone from '$lib/components/ui/file-drop-zone';
import { Input } from '$lib/components/ui/input';
import { Switch } from '$lib/components/ui/switch';
import { Textarea } from '$lib/components/ui/textarea';
import { m } from '$lib/paraglide/messages';
import PellEditor from './pell-editor.svelte';

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

// Snapshot page prop for initial values (intentionally non-reactive)
// svelte-ignore state_referenced_locally
const initialPage = page;
let title = $state((initialPage?.title as string) ?? '');
let slug = $state((initialPage?.slug as string) ?? '');
let description = $state((initialPage?.description as string) ?? '');
let content = $state((initialPage?.content as string) ?? '');
let imageAlt = $state((initialPage?.imageAlt as string) ?? '');
let imageCaption = $state((initialPage?.imageCaption as string) ?? '');
let manualSlug = $state(!!initialPage);
let error = $state('');

// Variant fields for non-English languages
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

function getVariant(lang: string): Variant | undefined {
  return variants.find((v) => v.language === lang);
}

function generateSlug(val: string): string {
  if (manualSlug) {
    return slug;
  }
  const words = (stopwordsAll as Record<string, string[]>).en ?? [];
  return (
    val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      // biome-ignore lint/performance/useTopLevelRegex: intentional inline regex
      .split(/\s+/)
      .filter((w) => w && w.length > 1 && !words.includes(w))
      .join('-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') ||
    val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
  );
}

function handleTitleChange() {
  if (!manualSlug) {
    slug = generateSlug(title);
  }
}

function handleImageSelect(files: File[]) {
  const file = files[0];
  if (!file) {
    return;
  }
  imageFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function handleEnhance() {
  saving = true;
  error = '';
  return ({ result }: { result: { type: string; data?: Record<string, unknown> } }) => {
    saving = false;
    if (result.type === 'success' || result.type === 'redirect') {
      onSuccess();
    } else {
      error = (result.data?.error as string) ?? m.pageEditorSaveFailed();
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
</script>
// biome-ignore lint/style/noRestrictedGlobals: intentional usage
{#if error}
  // biome-ignore lint/style/noRestrictedGlobals: intentional usage
  <div class="bg-destructive/10 text-destructive rounded-lg border p-4 text-sm mb-4">{error}</div>
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
      <!-- English: base page fields -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg font-bold">{page?.id ? m.pageEditorTitleEdit() : m.pageEditorTitleNew()}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-bold block mb-2" for="title">
              <span>{m.pageEditorTitleLabel()}</span>
              <Required set={!isEmpty(title)} />
            </label>
            <Input
              id="title"
              name="title"
              oninput={handleTitleChange}
              placeholder={m.pageEditorTitlePlaceholder()}
              required
              bind:value={title}
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <label class="text-sm font-bold block" for="slug">
                <span>{m.pageEditorSlugLabel()}</span>
                <Required set={!isEmpty(slug)} />
              </label>
              <label class="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                <Switch aria-label={m.pageEditorSlugManual()} class="scale-75" bind:checked={manualSlug} />
                {m.pageEditorSlugManual()}
              </label>
            </div>
            <Input
              class="font-mono text-sm"
              id="slug"
              name="slug"
              placeholder={m.pageEditorSlugPlaceholder()}
              required
              bind:value={slug}
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold block mb-2" for="description">{m.pageEditorDescriptionLabel()}</label>
            <Textarea
              id="description"
              name="description"
              placeholder={m.pageEditorDescriptionPlaceholder()}
              bind:value={description}
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold block mb-2" for="content">{m.pageEditorContentLabel()}</label>
            <input name="content" type="hidden" value={content} />
            <PellEditor id="page-content" bind:value={content} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg font-bold">{m.pageEditorImage()}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <FileDropZone.Root accept={FileDropZone.ACCEPT_IMAGE} onUpload={handleImageSelect}>
            {#snippet children()}
              <FileDropZone.Trigger />
            {/snippet}
          </FileDropZone.Root>
          <input name="image" type="hidden" value={imagePreview} />
          <div class="space-y-4 pt-4">
            <div class="space-y-2">
              <label class="text-sm font-bold block mb-2" for="imageAlt">{m.pageEditorImageAltLabel()}</label>
              <Input
                id="imageAlt"
                name="imageAlt"
                placeholder={m.pageEditorImageAltPlaceholder()}
                bind:value={imageAlt}
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold block mb-2" for="imageCaption">{m.pageEditorImageCaptionLabel()}</label>
              <Input
                id="imageCaption"
                name="imageCaption"
                placeholder={m.pageEditorImageCaptionPlaceholder()}
                bind:value={imageCaption}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    {:else}
      {@const v = getVariant(selectedLang)}
      {#if v}
        <Card>
          <CardHeader>
            <CardTitle class="text-lg font-bold"
              >{m.pageEditorVariantTitle({ lang: languages.find((l) => l.code === selectedLang)?.label ?? selectedLang })}</CardTitle
            >
          </CardHeader>
          <CardContent class="space-y-4">
            <p class="text-muted-foreground text-xs italic">{m.pageEditorVariantFallback()}</p>

            <div class="space-y-2">
              <label class="text-sm font-bold block mb-2" for="var-title">{m.pageEditorVariantTitleLabel()}</label>
              <Input dir={selectedLang === 'he' ? 'rtl' : undefined} id="var-title" bind:value={v.title} />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold block mb-2" for="var-desc">{m.pageEditorDescriptionLabel()}</label>
              <Textarea dir={selectedLang === 'he' ? 'rtl' : undefined} id="var-desc" bind:value={v.description} />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold block mb-2" for="var-content">{m.pageEditorContentLabel()}</label>
              <PellEditor dir={selectedLang === 'he' ? 'rtl' : undefined} id="var-content" bind:value={v.content} />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-bold block mb-2" for="var-imgalt"
                  >{m.pageEditorVariantImageAltLabel()}</label
                >
                <Input dir={selectedLang === 'he' ? 'rtl' : undefined} id="var-imgalt" bind:value={v.imageAlt} />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-bold block mb-2" for="var-imgcap"
                  >{m.pageEditorVariantImageCaptionLabel()}</label
                >
                <Input dir={selectedLang === 'he' ? 'rtl' : undefined} id="var-imgcap" bind:value={v.imageCaption} />
              </div>
            </div>
          </CardContent>
        </Card>
      {/if}
    {/if}
  </div>

  <div class="flex gap-2">
    // biome-ignore lint/complexity/useSimplifiedLogicExpression: intentional logic expression
    <Button disabled={!title || !slug || saving} type="submit">
      // biome-ignore lint/style/noNestedTernary: intentional nested ternary
      {saving ? m.pageEditorSaving() : page?.id ? m.pageEditorUpdatePage() : m.pageEditorCreatePage()}
    </Button>
    <Button onclick={() => goto('/admin/pages')} type="button" variant="outline">{m.pageEditorCancel()}</Button>
  </div>
</form>
