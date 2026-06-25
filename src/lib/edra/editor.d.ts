import { type Content, Editor, type EditorOptions, type Extensions } from '@tiptap/core';
import 'katex/dist/katex.min.css';

declare const _default: (
  element?: HTMLElement,
  content?: Content,
  extensions?: Extensions,
  options?: Partial<EditorOptions>
) => Editor;
export default _default;
