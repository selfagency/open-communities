<script lang="ts">
import stopwordsAll from 'stopwords-iso';
import Required from '$lib/components/form/required.svelte';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { Switch } from '$lib/components/ui/switch';
import { Textarea } from '$lib/components/ui/textarea';
import { m } from '$lib/paraglide/messages';
import PellEditor from './pell-editor.svelte';

let {
  title = $bindable(''),
  slug = $bindable(''),
  description = $bindable(''),
  content = $bindable(''),
  manualSlug = $bindable(false)
}: {
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  manualSlug?: boolean;
} = $props();

function generateSlug(val: string): string {
  if (manualSlug) {
    return slug;
  }
  const words = (stopwordsAll as Record<string, string[]>).en ?? [];
  return (
    val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      // biome-ignore lint/performance/useTopLevelRegex: inline regex in test
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

// Auto-generate slug from title reactively. Using $effect (rather than an
// oninput handler that reads `title`) avoids a stale-read race where the
// handler fires before the bound `title` state has propagated — which left
// the slug empty and the submit button disabled in production builds.
$effect(() => {
  // Track title explicitly so the effect re-runs on every change.
  const currentTitle = title;
  if (!manualSlug) {
    slug = generateSlug(currentTitle);
  }
});
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold">{m.pageEditorTitleNew()}</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <div class="space-y-2">
      <label class="text-sm font-bold block mb-2" for="title">
        <span>{m.pageEditorTitleLabel()}</span>
        <Required set={title !== ''} />
      </label>
      <Input
        id="title"
        name="title"
        placeholder={m.pageEditorTitlePlaceholder()}
        required
        bind:value={title}
      />
    </div>

    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <label class="text-sm font-bold block" for="slug">
          <span>{m.pageEditorSlugLabel()}</span>
          <Required set={slug !== ''} />
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
