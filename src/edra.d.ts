declare module 'edra/dist/edra/shadcn/editor.svelte' {
  import type { SvelteComponent } from 'svelte';
  import type { Content, Editor } from '@tiptap/core';

  interface EdraEditorProps {
    content?: Content;
    editable?: boolean;
    editor?: Editor;
    autofocus?: boolean;
    onUpdate?: () => void;
    class?: string;
    children?: import('svelte').Snippet<[]>;
  }

  const EdraEditor: new (...args: unknown[]) => SvelteComponent<EdraEditorProps>;
  export default EdraEditor;
}

declare module 'edra/dist/edra/shadcn/toolbar.svelte' {
  import type { SvelteComponent } from 'svelte';
  import type { Editor } from '@tiptap/core';

  interface EdraToolbarProps {
    editor: Editor;
    class?: string;
    excludedCommands?: string[];
    children?: import('svelte').Snippet<[]>;
  }

  const EdraToolBar: new (...args: unknown[]) => SvelteComponent<EdraToolbarProps>;
  export default EdraToolBar;
}
