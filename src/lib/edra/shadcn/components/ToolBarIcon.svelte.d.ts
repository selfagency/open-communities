import type { Editor } from '@tiptap/core';
import type { EdraToolBarCommands } from '../../commands/types.js';

interface Props {
  editor: Editor;
  command: EdraToolBarCommands;
}
declare const ToolBarIcon: import('svelte').Component<Props, {}, ''>;
type ToolBarIcon = ReturnType<typeof ToolBarIcon>;
export default ToolBarIcon;
