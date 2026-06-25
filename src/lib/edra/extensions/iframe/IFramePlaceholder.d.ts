import { Node, type NodeViewProps } from '@tiptap/core';
import type { Component } from 'svelte';
export interface IFramePlaceholderOptions {
    HTMLAttributes: Record<string, object>;
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        iframePlaceholder: {
            /**
             * Inserts a IFrame placeholder
             */
            insertIFramePlaceholder: () => ReturnType;
        };
    }
}
export declare const IFramePlaceholder: (content: Component<NodeViewProps>) => Node<IFramePlaceholderOptions, any>;
