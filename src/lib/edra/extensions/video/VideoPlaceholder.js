import { Editor, Node, mergeAttributes } from '@tiptap/core';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';
export const VideoPlaceholder = (content) => Node.create({
    name: 'video-placeholder',
    addOptions() {
        return {
            HTMLAttributes: {},
            onDrop: () => { },
            onDropRejected: () => { },
            onEmbed: () => { }
        };
    },
    parseHTML() {
        return [{ tag: `div[data-type="${this.name}"]` }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes)];
    },
    group: 'block',
    draggable: true,
    atom: true,
    content: 'inline*',
    isolating: true,
    addNodeView() {
        return SvelteNodeViewRenderer(content);
    },
    addCommands() {
        return {
            insertVideoPlaceholder: () => (props) => {
                return props.commands.insertContent({
                    type: 'video-placeholder'
                });
            }
        };
    }
});
