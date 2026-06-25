import { Node, mergeAttributes } from '@tiptap/core';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';
export const IFramePlaceholder = (content) => Node.create({
    name: 'iframe-placeholder',
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
            insertIFramePlaceholder: () => (props) => {
                return props.commands.insertContent({
                    type: 'iframe-placeholder'
                });
            }
        };
    }
});
