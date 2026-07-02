<script lang="ts">
import { stripHtml } from 'string-strip-html';
import { onMount } from 'svelte';

const FONT_STYLE_KEYS = ['font-family', 'font-size', 'font-weight', 'font-style', 'color'];

function stripFontStyles(html: string): string {
  return html.replace(/style\s*=\s*"([^"]*)"/gi, (_match, attrs: string) => {
    const filtered = attrs.split(';').filter((decl: string) => {
      const trimmed = decl.trim();
      if (!trimmed) {
        return false;
      }
      const key = trimmed.split(':')[0]?.trim().toLowerCase();
      return key && !FONT_STYLE_KEYS.includes(key);
    });
    return filtered.length > 0 ? `style="${filtered.join(';').trim()}"` : '';
  });
}

function sanitizeHtml(html: string): string {
  const noFontTags = stripHtml(html, { onlyStripTags: ['font'] }).result;
  return stripFontStyles(noFontTags);
}

let {
  value = $bindable(''),
  id = 'wysi-editor',
  dir
}: {
  value: string;
  id?: string;
  dir?: 'rtl' | 'ltr';
} = $props();

// biome-ignore lint/suspicious/noUnassignedVariables: assigned via Svelte bind:this
let textareaEl: HTMLTextAreaElement;

onMount(() => {
  if (!textareaEl) {
    return;
  }

  Wysi({
    el: textareaEl,
    height: 300,
    autoGrow: true,
    onChange: (html: string) => {
      value = sanitizeHtml(html);
    }
  });

  if (value) {
    textareaEl.value = sanitizeHtml(value);
  }
});
</script>

<div class="wysi-wrapper" data-editor-id={id} class:rtl={dir === 'rtl'}>
  <textarea {id} bind:this={textareaEl}>{value}</textarea>
</div>

<style>
.wysi-wrapper {
  min-height: 300px;
}
.wysi-wrapper :global(.wysi-toolbar) {
  background-color: var(--background);
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: var(--radius) var(--radius) 0 0;
}
.wysi-wrapper :global(.wysi-editor) {
  min-height: 280px;
  padding: 1rem;
  outline: none;
  border: 1px solid var(--border);
  border-radius: 0 0 var(--radius) var(--radius);
}
.wysi-wrapper.rtl :global(.wysi-editor) {
  direction: rtl;
}
.wysi-wrapper :global(.wysi-btn) {
  padding: 0.5rem 0.6rem;
  color: var(--foreground);
  cursor: pointer;
  background-color: var(--background);
  border: none;
}
.wysi-wrapper :global(.wysi-btn:hover) {
  background-color: var(--accent);
}
.wysi-wrapper :global(.wysi-btn.active) {
  background-color: var(--accent);
}
</style>
