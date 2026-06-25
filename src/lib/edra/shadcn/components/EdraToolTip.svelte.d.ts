import type { Snippet } from 'svelte';
interface Props {
    tooltip: string;
    children: Snippet<[]>;
    shortCut?: string;
}
declare const EdraToolTip: import("svelte").Component<Props, {}, "">;
type EdraToolTip = ReturnType<typeof EdraToolTip>;
export default EdraToolTip;
