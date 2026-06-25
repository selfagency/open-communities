import { mount } from 'svelte';
import type { Editor, NodeViewProps } from '@tiptap/core';
interface RendererOptions<P extends Record<string, unknown>> {
    editor: Editor;
    props: P;
}
type App = ReturnType<typeof mount>;
declare class SvelteRenderer<R = unknown, P extends Record<string, any> = object> {
    id: string;
    component: App;
    editor: Editor;
    props: P;
    element: HTMLElement;
    ref: R | null;
    mnt: Record<any, any> | null;
    constructor(component: App, { props, editor }: RendererOptions<P>);
    render(): void;
    updateProps(props: Partial<NodeViewProps>): void;
    updateAttributes(attributes: Record<string, string>): void;
    destroy(): void;
}
export default SvelteRenderer;
