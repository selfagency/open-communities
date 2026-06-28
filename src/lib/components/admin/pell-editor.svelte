<script lang="ts">
import pell from 'pell';
import { onMount } from 'svelte';
import 'pell/dist/pell.min.css';

let {
  value = $bindable(''),
  id = 'pell-editor',
  dir
}: {
  value: string;
  id?: string;
  dir?: 'rtl' | 'ltr';
} = $props();

// biome-ignore lint/suspicious/noUnassignedVariables: assigned via Svelte bind:this
let editorEl: HTMLDivElement;
let editor: ReturnType<typeof pell.init>;

onMount(() => {
  if (!editorEl) {
    return;
  }

  editor = pell.init({
    element: editorEl,
    defaultParagraphSeparator: 'p',
    styleWithCSS: false,
    onChange: (html: string) => {
      value = html;
    },
    actions: [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'heading1',
      'heading2',
      'paragraph',
      'quote',
      'olist',
      'ulist',
      'code',
      'line',
      'link'
    ]
  });

  if (value) {
    editor.content.innerHTML = value;
  }
});
</script>

<div class="pell-wrapper" data-editor-id={id} class:rtl={dir === 'rtl'}>
  <div bind:this={editorEl}></div>
</div>

<style>
.pell-wrapper {
  min-height: 300px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.pell-wrapper :global(.pell-content) {
  box-sizing: border-box;
  min-height: 280px;
  padding: 1rem;
  outline: none;
}
.pell-wrapper.rtl :global(.pell-content) {
  direction: rtl;
}
.pell-wrapper :global(.pell-content) {
  height: auto;
}
.pell-wrapper :global(.pell-actionbar) {
  background-color: var(--background);
  border-bottom: 1px solid var(--border);
}
.pell-wrapper :global(.pell-button) {
  padding: 0.5rem 0.6rem;
  color: var(--foreground);
  cursor: pointer;
  background-color: var(--background);
  border: none;
}
.pell-wrapper :global(.pell-button:hover) {
  background-color: var(--accent);
}
.pell-wrapper :global(.pell-button-selected) {
  background-color: var(--accent);
}
</style>
