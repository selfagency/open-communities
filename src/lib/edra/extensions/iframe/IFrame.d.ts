import { Node } from '@tiptap/core';
export interface IframeOptions {
    allowFullscreen: boolean;
    HTMLAttributes: {
        [key: string]: unknown;
    };
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        iframe: {
            /**
             * Add an iframe with src
             */
            setIframe: (options: {
                src: string;
            }) => ReturnType;
            removeIframe: () => ReturnType;
        };
    }
}
declare const _default: Node<IframeOptions, any>;
export default _default;
