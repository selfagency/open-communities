import commands from '../../commands/toolbar-commands.js';
import Quote from '@lucide/svelte/icons/quote';
import SquareCode from '@lucide/svelte/icons/square-code';
import Minus from '@lucide/svelte/icons/minus';
export const GROUPS = [
    {
        name: 'format',
        title: 'Format',
        actions: [
            ...commands.headings,
            {
                icon: Quote,
                name: 'blockquote',
                tooltip: 'Blockquote',
                onClick: (editor) => {
                    editor.chain().focus().setBlockquote().run();
                }
            },
            {
                icon: SquareCode,
                name: 'codeBlock',
                tooltip: 'Code Block',
                onClick: (editor) => {
                    editor.chain().focus().setCodeBlock().run();
                }
            },
            ...commands.lists
        ]
    },
    {
        name: 'insert',
        title: 'Insert',
        actions: [
            ...commands.media,
            ...commands.table,
            {
                icon: Minus,
                name: 'horizontalRule',
                tooltip: 'Horizontal Rule',
                onClick: (editor) => {
                    editor.chain().focus().setHorizontalRule().run();
                }
            }
        ]
    }
];
export default GROUPS;
