<script lang="ts">
import { stripHtml } from 'string-strip-html';
import { onMount } from 'svelte';
import { browser } from '$app/environment';

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
let showHtml = $state(false);

onMount(() => {
  if (!(textareaEl && browser)) {
    return;
  }

  // Load Wysi CSS and JS dynamically
  if (!document.querySelector('link[href*="wysi.min.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/wysi.min.css';
    document.head.appendChild(link);
  }

  async function initWysi() {
    if (typeof globalThis.Wysi === 'undefined') {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/wysi.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Wysi'));
        document.head.appendChild(script);
      });
    }

    globalThis.Wysi({
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
  }

  initWysi();
});

// When value changes externally (e.g. from translation), update both the textarea and Wysi editor
$effect(() => {
  const current = value;
  if (textareaEl && typeof globalThis.Wysi !== 'undefined') {
    textareaEl.value = sanitizeHtml(current);
    // Wysi creates a contenteditable div — update its content too
    const editor = textareaEl.parentElement?.querySelector('.wysi-editor');
    if (editor) {
      editor.innerHTML = sanitizeHtml(current);
    }
  }
});

function toggleHtml() {
  showHtml = !showHtml;
  if (showHtml) {
    // Switching to HTML view — sync textarea with current value
    textareaEl.value = value;
  } else {
    // Switching back to Wysi — sync Wysi editor with current textarea value
    value = textareaEl.value;
    if (typeof globalThis.Wysi !== 'undefined') {
      const editor = textareaEl.parentElement?.querySelector('.wysi-editor');
      if (editor) {
        editor.innerHTML = sanitizeHtml(value);
      }
    }
  }
}
</script>

<div class="wysi-wrapper" data-editor-id={id} class:rtl={dir === 'rtl'} class:show-html={showHtml}>
  <div class="wysi-toolbar-row">
    <button class="html-toggle" onclick={toggleHtml} type="button">
      {showHtml ? 'Visual' : 'HTML'}
    </button>
  </div>
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
.wysi-wrapper :global(.wysi-editor a) {
  color: var(--wysi-primary, #027ffe);
  text-decoration: underline;
}
.wysi-wrapper :global(.wysi-editor a:hover) {
  opacity: 0.8;
}
.wysi-wrapper.show-html :global(.wysi-editor) {
  display: none;
}
.wysi-wrapper.show-html :global(.wysi-toolbar) {
  display: none;
}
.wysi-wrapper.show-html textarea {
  display: block;
  width: 100%;
  min-height: 300px;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--foreground);
  resize: vertical;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 0 0 var(--radius) var(--radius);
}
.wysi-toolbar-row {
  display: flex;
  justify-content: flex-end;
  padding: 4px 4px 0;
}
.html-toggle {
  padding: 2px 8px;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  cursor: pointer;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.html-toggle:hover {
  background: var(--accent);
}
</style>
