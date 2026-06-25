import { type Snippet } from 'svelte';
import { type BubbleMenuPluginProps } from '@tiptap/extension-bubble-menu';
import type { Editor } from '@tiptap/core';
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
interface Props extends Optional<Omit<Optional<BubbleMenuPluginProps, 'pluginKey'>, 'element'>, 'editor'> {
    editor?: Editor;
    children?: Snippet<[]>;
    class?: string;
    style?: string;
    pluginKey?: string;
    updateDelay?: number;
    resizeDelay?: number;
}
declare const BubbleMenu: import("svelte").Component<Props, {}, "">;
type BubbleMenu = ReturnType<typeof BubbleMenu>;
export default BubbleMenu;
