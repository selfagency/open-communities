import { Node } from '@tiptap/core';
export interface AudioOptions {
    HTMLAttributes: Record<string, unknown>;
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        audio: {
            /**
             * Set a audio node
             */
            setAudio: (src: string) => ReturnType;
            /**
             * Toggle a audio
             */
            toggleAudio: (src: string) => ReturnType;
            /**
             * Remove a audio
             */
            removeAudio: () => ReturnType;
        };
    }
}
export declare const Audio: Node<AudioOptions, any>;
