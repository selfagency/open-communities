import { Editor, Node, type NodeViewProps } from '@tiptap/core';
import type { Component } from 'svelte';
export interface ImagePlaceholderOptions {
    HTMLAttributes: Record<string, object>;
    onDrop: (files: File[], editor: Editor) => void;
    onDropRejected?: (files: File[], editor: Editor) => void;
    onEmbed: (url: string, editor: Editor) => void;
    allowedMimeTypes?: Record<string, string[]>;
    maxFiles?: number;
    maxSize?: number;
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        imagePlaceholder: {
            /**
             * Inserts an image placeholder
             */
            insertImagePlaceholder: () => ReturnType;
        };
    }
}
export declare const ImagePlaceholder: (component: Component<NodeViewProps>) => Node<ImagePlaceholderOptions>;
