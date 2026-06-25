import { Node, nodeInputRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
const AUDIO_INPUT_REGEX = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;
export const Audio = Node.create({
    name: 'audio',
    group: 'block',
    draggable: true,
    isolating: true,
    atom: true,
    addOptions() {
        return {
            HTMLAttributes: {}
        };
    },
    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: (el) => el.getAttribute('src'),
                renderHTML: (attrs) => ({ src: attrs.src })
            }
        };
    },
    parseHTML() {
        return [
            {
                tag: 'audio',
                getAttrs: (el) => ({ src: el.getAttribute('src') })
            }
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'audio',
            { controls: 'true', style: 'width: 100%;', ...HTMLAttributes },
            ['source', HTMLAttributes]
        ];
    },
    addCommands() {
        return {
            setAudio: (src) => ({ commands }) => commands.insertContent(`<audio controls autoplay="false" style="width: 100%;" src="${src}"></audio>`),
            toggleAudio: () => ({ commands }) => commands.toggleNode(this.name, 'paragraph'),
            removeAudio: () => ({ commands }) => commands.deleteNode(this.name)
        };
    },
    addInputRules() {
        return [
            nodeInputRule({
                find: AUDIO_INPUT_REGEX,
                type: this.type,
                getAttributes: (match) => {
                    const [, , src] = match;
                    return { src };
                }
            })
        ];
    },
    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('audioDropPlugin'),
                props: {
                    handleDOMEvents: {
                        drop(view, event) {
                            const { state: { schema, tr }, dispatch } = view;
                            const hasFiles = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length;
                            if (!hasFiles)
                                return false;
                            const audios = Array.from(event.dataTransfer.files).filter((file) => /audio/i.test(file.type));
                            if (audios.length === 0)
                                return false;
                            event.preventDefault();
                            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                            audios.forEach((audio) => {
                                const reader = new FileReader();
                                reader.onload = (readerEvent) => {
                                    const node = schema.nodes.audio.create({ src: readerEvent.target?.result });
                                    if (coordinates && typeof coordinates.pos === 'number') {
                                        const transaction = tr.insert(coordinates?.pos, node);
                                        dispatch(transaction);
                                    }
                                };
                                reader.readAsDataURL(audio);
                            });
                            return true;
                        }
                    }
                }
            })
        ];
    }
});
