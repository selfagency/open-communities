import { Editor, Node, mergeAttributes } from '@tiptap/core';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';
export const ImagePlaceholder = (component) => Node.create({
    name: 'image-placeholder',
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
        return SvelteNodeViewRenderer(component);
    },
    addCommands() {
        return {
            insertImagePlaceholder: () => (props) => {
                return props.commands.insertContent({
                    type: 'image-placeholder'
                });
            }
        };
    }
});
