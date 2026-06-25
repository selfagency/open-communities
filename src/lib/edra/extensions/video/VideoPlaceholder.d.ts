import { Editor, Node, type NodeViewProps } from '@tiptap/core';
import type { Component } from 'svelte';
export interface VideoPlaceholderOptions {
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
        videoPlaceholder: {
            /**
             * Inserts a video placeholder
             */
            insertVideoPlaceholder: () => ReturnType;
        };
    }
}
export declare const VideoPlaceholder: (content: Component<NodeViewProps>) => Node<VideoPlaceholderOptions, any>;
