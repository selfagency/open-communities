<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import { browser } from '$app/environment';
import 'suneditor/css/editor';
import SunEditor, { plugins } from 'suneditor';

let {
  value = $bindable(''),
  id = 'suneditor',
  dir
}: {
  value: string;
  id?: string;
  dir?: 'rtl' | 'ltr';
} = $props();

// biome-ignore lint/suspicious/noUnassignedVariables: assigned via Svelte bind:this
let textareaEl: HTMLTextAreaElement;
let editor: ReturnType<typeof SunEditor.create> | null = null;

onMount(() => {
  if (!(textareaEl && browser)) {
    return;
  }

  editor = SunEditor.create(textareaEl, {
    plugins,
    buttonList: [
      ['undo', 'redo'],
      ['bold', 'italic', 'underline', 'strike'],
      ['list', 'link', 'image', 'table', 'codeView'],
      ['removeFormat']
    ],
    height: 'auto',
    minHeight: '300px',
    placeholder: 'Page content...',
    textDirection: dir === 'rtl' ? 'rtl' : 'ltr',
    freeCodeViewMode: true,
    events: {
      onChange: (params: { data: string }) => {
        value = params.data;
      }
    } as any
  });
});

onDestroy(() => {
  editor?.destroy();
});
</script>

<div class="suneditor-wrapper" data-editor-id={id}>
  <textarea {id} bind:this={textareaEl}>{value}</textarea>
</div>

<style>
.suneditor-wrapper {
  min-height: 300px;
}
.suneditor-wrapper :global(.se-wrapper) {
  min-height: 300px;
}
</style>
