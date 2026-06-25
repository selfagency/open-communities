import type { Editor } from '@tiptap/core';
import { DecorationSet, type EditorView } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';
/**
 * Check if the current browser is in mac or not
 */
export declare const isMac: boolean;
/**
 * Function to handle paste event of an image
 * @param editor Editor - editor instance
 * @param maxSize number - max size of the image to be pasted in MB, default is 2MB
 */
export declare function getHandlePaste(editor: Editor, maxSize?: number): (view: EditorView, event: ClipboardEvent) => void;
export declare const findColors: (doc: Node) => DecorationSet;
/**
 * Dupilcate content at the current selection
 * @param editor Editor instance
 * @param node Node to be duplicated
 */
export declare const duplicateContent: (editor: Editor, node: Node) => void;
/**
 * Sets focus on the editor and moves the cursor to the clicked text position,
 * defaulting to the end of the document if the click is outside any text.
 *
 * @param editor - Editor instance
 * @param event - Optional MouseEvent or KeyboardEvent triggering the focus
 */
export declare function focusEditor(editor: Editor | undefined, event?: MouseEvent | KeyboardEvent): void;
