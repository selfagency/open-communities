import type { EdraToolBarCommands } from '../../commands/types.js';
import { type Editor } from '@tiptap/core';
interface Props {
    editor: Editor;
    command: EdraToolBarCommands;
}
declare const ToolBarIcon: import("svelte").Component<Props, {}, "">;
type ToolBarIcon = ReturnType<typeof ToolBarIcon>;
export default ToolBarIcon;
