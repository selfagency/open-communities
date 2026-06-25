import { Node } from '@tiptap/core';
export interface VideoOptions {
    HTMLAttributes: Record<string, unknown>;
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        video: {
            /**
             * Set a video node
             */
            setVideo: (src: string) => ReturnType;
            /**
             * Toggle a video
             */
            toggleVideo: (src: string) => ReturnType;
            /**
             * Remove a video
             */
            removeVideo: () => ReturnType;
        };
    }
}
export declare const Video: Node<VideoOptions, any>;
