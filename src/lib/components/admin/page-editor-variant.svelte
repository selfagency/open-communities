<script lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { Textarea } from '$lib/components/ui/textarea';
import { m } from '$lib/paraglide/messages';
import SunEditor from './suneditor.svelte';

interface Language {
  code: string;
  label: string;
}

let {
  variant,
  language
}: {
  variant: {
    title: string;
    description: string;
    content: string;
    imageAlt: string;
    imageCaption: string;
  };
  language: Language;
} = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold">{m.pageEditorVariantTitle({ lang: language.label })}</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <p class="text-muted-foreground text-xs italic">{m.pageEditorVariantFallback()}</p>

    <div class="space-y-2">
      <label class="text-sm font-bold block mb-2" for="var-title">
        {m.pageEditorVariantTitleLabel()}
      </label>
      <Input dir={language.code === 'he' ? 'rtl' : undefined} id="var-title" bind:value={variant.title} />
    </div>

    <div class="space-y-2">
      <label class="text-sm font-bold block mb-2" for="var-desc">
        {m.pageEditorDescriptionLabel()}
      </label>
      <Textarea dir={language.code === 'he' ? 'rtl' : undefined} id="var-desc" bind:value={variant.description} />
    </div>

    <div class="space-y-2">
      <label class="text-sm font-bold block mb-2" for="var-content">
        {m.pageEditorContentLabel()}
      </label>
      <SunEditor dir={language.code === 'he' ? 'rtl' : undefined} id="var-content" bind:value={variant.content} />
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <label class="text-sm font-bold block mb-2" for="var-imgalt">
          {m.pageEditorVariantImageAltLabel()}
        </label>
        <Input dir={language.code === 'he' ? 'rtl' : undefined} id="var-imgalt" bind:value={variant.imageAlt} />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-bold block mb-2" for="var-imgcap">
          {m.pageEditorVariantImageCaptionLabel()}
        </label>
        <Input dir={language.code === 'he' ? 'rtl' : undefined} id="var-imgcap" bind:value={variant.imageCaption} />
      </div>
    </div>
  </CardContent>
</Card>
