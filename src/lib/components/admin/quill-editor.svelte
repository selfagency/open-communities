<script lang="ts">
  import 'quill/dist/quill.snow.css';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let {
    value = $bindable(''),
    placeholder = 'Write content...',
    id = 'quill-editor'
  }: {
    value: string;
    placeholder?: string;
    id?: string;
  } = $props();

  let editorEl: HTMLDivElement;
  let quill: any = null;

  function updateContent() {
    if (quill) {
      const html = quill.root.innerHTML;
      if (html !== value) {
        value = html;
      }
    }
  }

  $effect(() => {
    // When value changes externally, update editor content
    if (quill && value !== quill.root.innerHTML) {
      quill.root.innerHTML = value || '';
    }
  });

  onMount(async () => {
    if (!browser || !editorEl) return;

    const Quill = (await import('quill')).default;
    quill = new Quill(editorEl, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'blockquote', 'code-block'],
          [{ align: [] }],
          ['clean']
        ]
      }
    });

    if (value) {
      quill.root.innerHTML = value;
    }

    quill.on('text-change', updateContent);
  });
</script>

<div class="quill-wrapper">
  <div bind:this={editorEl} {id}></div>
</div>

<style>
  .quill-wrapper {
    min-height: 300px;
  }
  .quill-wrapper :global(.ql-editor) {
    min-height: 280px;
  }
</style>
