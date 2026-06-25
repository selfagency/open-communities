<script lang="ts">
  import { isEmpty } from 'radashi';
  import stopwordsAll from 'stopwords-iso';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import Required from '$lib/components/form/required.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as FileDropZone from '$lib/components/ui/file-drop-zone';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import { Textarea } from '$lib/components/ui/textarea';
  import QuillEditor from './quill-editor.svelte';

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
    language: string;
    id?: string;
    title: string;
    description: string;
    content: string;
    imageAlt: string;
    imageCaption: string;
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

  // Base page fields (English)
  let title = $state((page?.title as string) ?? '');
  let slug = $state((page?.slug as string) ?? '');
  let description = $state((page?.description as string) ?? '');
  let content = $state((page?.content as string) ?? '');
  let imageAlt = $state((page?.imageAlt as string) ?? '');
  let imageCaption = $state((page?.imageCaption as string) ?? '');
  let manualSlug = $state(!!page);
  let error = $state('');

  // Variant fields for non-English languages
  let variants = $state<Variant[]>(
    languages.filter((l) => l.code !== 'en').map((lang) => ({
      language: lang.code,
      title: '',
      description: '',
      content: '',
      imageAlt: '',
      imageCaption: ''
    }))
  );
  let imageFile = $state<File | null>(null);
  let imagePreview = $state((page?.image as string) ?? '');
  let variantsInput: HTMLInputElement;

  let selectedLang = $state('en');

  function getVariant(lang: string): Variant | undefined {
    return variants.find((v) => v.language === lang);
  }

  function generateSlug(val: string): string {
    if (manualSlug) return slug;
    const words = (stopwordsAll as Record<string, string[]>).en ?? [];
    return val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter((w) => w && w.length > 1 && !words.includes(w))
      .join('-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || val.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
  }

  function handleTitleChange() {
    if (!manualSlug) slug = generateSlug(title);
  }

  async function handleImageSelect(files: File[]) {
    const file = files[0];
    if (!file) return;
    imageFile = file;
    const reader = new FileReader();
    reader.onload = () => { imagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  function handleEnhance() {
    saving = true;
    error = '';
    return async ({ result }: { result: { type: string; data?: Record<string, unknown> } }) => {
      saving = false;
      if (result.type === 'success' || result.type === 'redirect') {
        onSuccess();
      } else {
        error = (result.data?.error as string) ?? 'Save failed';
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

{#if error}
  <div class="bg-destructive/10 text-destructive rounded-lg border p-4 text-sm mb-4">{error}</div>
{/if}

<form method="POST" {action} use:enhance={handleEnhance} onsubmit={beforeSubmit} class="space-y-6">
  <input type="hidden" name="variants" bind:this={variantsInput} value="" />
  {#if page?.id}<input type="hidden" name="id" value={page.id as string} />{/if}

  <div class="relative space-y-6">
    {#if page?.id}
      <div class="absolute right-4 top-4 z-10">
        <select
          bind:value={selectedLang}
          class="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <CardTitle class="text-lg font-bold">{page?.id ? 'Edit' : 'New Page'}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <label for="title" class="text-sm font-bold block mb-2">
            <span>Title</span>
            <Required set={!isEmpty(title)} />
          </label>
          <Input id="title" name="title" bind:value={title} required oninput={handleTitleChange} placeholder="Page title" />
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <label for="slug" class="text-sm font-bold block">
              <span>Slug</span>
              <Required set={!isEmpty(slug)} />
            </label>
            <label class="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
              <Switch bind:checked={manualSlug} aria-label="Manual slug" class="scale-75" />
              Manual
            </label>
          </div>
          <Input id="slug" name="slug" bind:value={slug} required placeholder="page-slug" pattern="[a-z0-9-]+" class="font-mono text-sm" />
        </div>

        <div class="space-y-2">
          <label for="description" class="text-sm font-bold block mb-2">Description</label>
          <Textarea id="description" name="description" bind:value={description} placeholder="Brief description of the page" />
        </div>

        <div class="space-y-2">
          <label for="content" class="text-sm font-bold block mb-2">Content</label>
          <input type="hidden" name="content" value={content} />
          <QuillEditor bind:value={content} id="page-content" placeholder="Page content..." />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg font-bold">Image</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <FileDropZone.Root accept={FileDropZone.ACCEPT_IMAGE} onUpload={handleImageSelect}>
          {#snippet children()}
            <FileDropZone.Trigger />
          {/snippet}
        </FileDropZone.Root>
        <input type="hidden" name="image" value={imagePreview} />
        <div class="space-y-4 pt-4">
          <div class="space-y-2">
            <label for="imageAlt" class="text-sm font-bold block mb-2">Alt Text</label>
            <Input id="imageAlt" name="imageAlt" bind:value={imageAlt} placeholder="Descriptive alt text" />
          </div>
          <div class="space-y-2">
            <label for="imageCaption" class="text-sm font-bold block mb-2">Caption</label>
            <Input id="imageCaption" name="imageCaption" bind:value={imageCaption} placeholder="Image caption" />
          </div>
        </div>
      </CardContent>
    </Card>
  {:else}
    <!-- Non-English: variant fields -->
    {@const v = getVariant(selectedLang)}
    {#if v}
      <Card>
        <CardHeader>
          <CardTitle class="text-lg font-bold">{languages.find((l) => l.code === selectedLang)?.label ?? selectedLang} Variant</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-muted-foreground text-xs italic">Leave blank to fall back to English.</p>

          <div class="space-y-2">
            <label for="var-title" class="text-sm font-bold block mb-2">Title</label>
            <Input id="var-title" bind:value={v.title} />
          </div>

          <div class="space-y-2">
            <label for="var-desc" class="text-sm font-bold block mb-2">Description</label>
            <Textarea id="var-desc" bind:value={v.description} />
          </div>

          <div class="space-y-2">
            <label for="var-content" class="text-sm font-bold block mb-2">Content</label>
            <QuillEditor bind:value={v.content} id="var-content" placeholder="Content in {selectedLang}..." />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <label for="var-imgalt" class="text-sm font-bold block mb-2">Image Alt Text</label>
              <Input id="var-imgalt" bind:value={v.imageAlt} />
            </div>
            <div class="space-y-2">
              <label for="var-imgcap" class="text-sm font-bold block mb-2">Image Caption</label>
              <Input id="var-imgcap" bind:value={v.imageCaption} />
            </div>
          </div>
        </CardContent>
      </Card>
    {/if}
  {/if}
  </div>

  <div class="flex gap-2">
    <Button type="submit" disabled={!title || !slug || saving}>
      {saving ? 'Saving...' : page?.id ? 'Update Page' : 'Create Page'}
    </Button>
    <Button variant="outline" type="button" onclick={() => goto('/admin/pages')}>Cancel</Button>
  </div>
</form>
