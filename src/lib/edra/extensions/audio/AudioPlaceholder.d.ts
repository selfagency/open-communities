import { Editor, Node, type NodeViewProps } from '@tiptap/core';
import type { Component } from 'svelte';
export interface AudioPlaceholderOptions {
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
        audioPlaceholder: {
            /**
             * Inserts an audio placeholder
             */
            insertAudioPlaceholder: () => ReturnType;
        };
    }
}
export declare const AudioPlaceholder: (component: Component<NodeViewProps>) => Node<AudioPlaceholderOptions>;
