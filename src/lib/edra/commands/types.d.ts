import { Icon } from '@lucide/svelte';
import type { Editor } from '@tiptap/core';
export interface EdraToolBarCommands {
  name: string;
  icon: typeof Icon;
  tooltip?: string;
  shortCut?: string;
  onClick?: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  clickable?: (editor: Editor) => boolean;
}
