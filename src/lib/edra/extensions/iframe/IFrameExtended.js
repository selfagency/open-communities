import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import IFrame from './IFrame.js';
export const IFrameExtended = (content) => IFrame.extend({
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
        return SvelteNodeViewRenderer(content);
    }
});
