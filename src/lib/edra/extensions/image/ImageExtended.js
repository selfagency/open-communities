import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import Image, {} from '@tiptap/extension-image';
export const ImageExtended = (component) => {
    return Image.extend({
        addAttributes() {
            return {
                src: {
                    default: null
                },
                alt: {
                    default: null
                },
                title: {
                    default: null
                },
                width: {
                    default: '100%'
                },
                height: {
                    default: null
                },
                align: {
                    default: 'left'
                }
            };
        },
        addNodeView: () => {
            return SvelteNodeViewRenderer(component);
        }
    }).configure({
        allowBase64: true
    });
};
