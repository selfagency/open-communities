<script lang="ts">
  import EdraEditor from '$lib/edra/shadcn/editor.svelte';
  import EdraToolBar from '$lib/edra/shadcn/toolbar.svelte';

  let {
    value = $bindable(''),
    placeholder = 'Write content...',
    id = 'edra-editor',
    dir
  }: {
    value: string;
    placeholder?: string;
    id?: string;
    dir?: 'rtl' | 'ltr';
  } = $props();

  let editor: import('@tiptap/core').Editor | undefined = $state();
  let mounted = $state(false);

  $effect(() => {
    mounted = true;
  });

  function handleUpdate() {
    if (editor) {
      value = editor.getHTML();
    }
  }

  // Set initial content once editor is ready
  $effect(() => {
    if (mounted && editor && value) {
      editor.commands.setContent(value);
    }
  });
</script>

<div class="edra-wrapper" data-editor-id={id} class:rtl={dir === 'rtl'}>
  {#if mounted}
    <EdraEditor
      bind:editor
      content={value}
      onUpdate={handleUpdate}
      class="min-h-[300px]"
    >
      <EdraToolBar {editor} />
    </EdraEditor>
  {/if}
</div>

<style>
  .edra-wrapper {
    min-height: 300px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .edra-wrapper :global(.ProseMirror) {
    min-height: 280px;
    padding: 1rem;
    outline: none;
  }
  .edra-wrapper.rtl :global(.ProseMirror) {
    direction: rtl;
  }
</style>
