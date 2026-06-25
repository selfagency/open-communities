import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import { Video } from './VideoExtension.js';
export const VideoExtended = (content) => Video.extend({
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
