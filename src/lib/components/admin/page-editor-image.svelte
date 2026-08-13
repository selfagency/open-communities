<script lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace pattern
import * as FileDropZone from '$lib/components/ui/file-drop-zone';
import { Input } from '$lib/components/ui/input';
import { m } from '$lib/paraglide/messages';

let {
  imageFile = $bindable(null),
  imagePreview = $bindable(''),
  imageAlt = $bindable(''),
  imageCaption = $bindable('')
}: {
  imageFile?: File | null;
  imagePreview?: string;
  imageAlt?: string;
  imageCaption?: string;
} = $props();

// biome-ignore lint/suspicious/useAwait: onUpload callback must return Promise<void>
async function handleImageSelect(files: File[]) {
  const [file] = files;
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
</script>

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
    {#if imagePreview}
      <input name="image" type="hidden" value={imagePreview} />
    {/if}
    <div class="space-y-4 pt-4">
      <div class="space-y-2">
        <label class="text-sm font-bold block mb-2" for="imageAlt">{m.pageEditorImageAltLabel()}</label>
        <Input id="imageAlt" name="imageAlt" placeholder={m.pageEditorImageAltPlaceholder()} bind:value={imageAlt} />
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
