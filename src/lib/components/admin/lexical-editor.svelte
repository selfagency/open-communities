<script lang="ts">
  import {
    AutoLinkNode,
    AutoLinkPlugin,
    Composer,
    ContentEditable,
    generateHtmlFromNodes,
    generateNodesFromDOM, 
    HistoryPlugin,
    LinkNode,
    LinkPlugin,
    ListItemNode,
    ListNode,
    ListPlugin,
    OnChangePlugin,
    RichTextPlugin
  } from 'svelte-lexical';
  import { theme } from 'svelte-lexical/dist/themes/default';
  import Toolbar from './lexical-toolbar.svelte';

  let {
    value = $bindable(''),
    placeholder = 'Write content...',
    id = 'lexical-editor',
    dir
  }: {
    value: string;
    placeholder?: string;
    id?: string;
    dir?: 'rtl' | 'ltr';
  } = $props();

  let composer: Composer;
  let mounted = $state(false);
  let initialHtml = value;

  const initialConfig = {
    theme,
    namespace: 'page_editor',
    nodes: [AutoLinkNode, LinkNode, ListNode, ListItemNode],
    onError: (error: Error) => {
      console.error('Lexical editor error:', error);
    }
  };

  $effect(() => {
    mounted = true;
  });

  function handleChange() {
    if (!composer) return;
    const editor = composer.getEditor();
    editor.read(() => {
      value = generateHtmlFromNodes(editor);
    });
  }

  // Import initial HTML once on mount
  $effect(() => {
    if (mounted && composer && initialHtml) {
      const editor = composer.getEditor();
      editor.update(() => {
        import('lexical').then(({ $getRoot }) => {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialHtml, 'text/html');
          const nodes = generateNodesFromDOM(editor, dom);
          $getRoot().clear();
          $getRoot().select().insertNodes(nodes);
        });
      });
      initialHtml = '';
    }
  });
</script>

<div class="lexical-wrapper svelte-lexical" data-editor-id={id}>
  <Composer {initialConfig} bind:this={composer}>
    <Toolbar {dir} />
    <div class="editor-container">
      <div class="editor-scroller">
        <div class="editor" class:rtl={dir === 'rtl'}>
          <ContentEditable
            className="SL_Theme__contentEditable"
            ariaLabel={placeholder}
          />
        </div>
      </div>
      <RichTextPlugin />
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <AutoLinkPlugin />
      <OnChangePlugin
        onChange={handleChange}
        ignoreHistoryMergeTagChange={false}
        ignoreSelectionChange={false}
      />
    </div>
  </Composer>
</div>

<!-- svelte-ignore css_unused_selector -->
<style>
  .lexical-wrapper {
    min-height: 300px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .lexical-wrapper :global(.editor-container) {
    position: relative;
  }
  .lexical-wrapper :global(.editor-scroller) {
    min-height: 280px;
    max-height: 600px;
    overflow-y: auto;
  }
  .lexical-wrapper :global(.editor) {
    min-height: 280px;
    padding: 1rem;
    outline: none;
  }
  .lexical-wrapper :global(.editor.rtl) {
    direction: rtl;
  }
  .lexical-wrapper :global(.SL_Theme__contentEditable) {
    outline: none;
    min-height: 280px;
  }
  .lexical-wrapper :global(.SL_Theme__paragraph) {
    margin: 0 0 0.5rem;
  }
  .lexical-wrapper :global(.SL_Theme__heading-h1) {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  .lexical-wrapper :global(.SL_Theme__heading-h2) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }
  .lexical-wrapper :global(.SL_Theme__heading-h3) {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }
  .lexical-wrapper :global(.SL_Theme__list-ul) {
    padding-left: 1.5rem;
    margin: 0 0 0.5rem;
  }
  .lexical-wrapper :global(.SL_Theme__list-ol) {
    padding-left: 1.5rem;
    margin: 0 0 0.5rem;
  }
  .lexical-wrapper :global(.SL_Theme__code) {
    background: var(--muted);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.875rem;
  }
  .lexical-wrapper :global(.SL_Theme__code-block) {
    background: var(--muted);
    padding: 1rem;
    border-radius: var(--radius);
    font-family: monospace;
    font-size: 0.875rem;
    margin: 0 0 0.5rem;
    overflow-x: auto;
  }
  .lexical-wrapper :global(.SL_Theme__quote) {
    border-left: 3px solid var(--border);
    padding-left: 1rem;
    margin: 0 0 0.5rem;
    color: var(--muted-foreground);
    font-style: italic;
  }
</style>
