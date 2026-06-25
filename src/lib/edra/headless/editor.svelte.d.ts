import type { EdraEditorProps } from '../types.js';
import '../editor.css';
import './style.css';
import '../onedark.css';
declare const Editor: import("svelte").Component<EdraEditorProps, {}, "editor">;
type Editor = ReturnType<typeof Editor>;
export default Editor;
