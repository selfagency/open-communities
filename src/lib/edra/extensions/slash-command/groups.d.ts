import type { EdraToolBarCommands } from '../../commands/types.js';
export interface Group {
    name: string;
    title: string;
    actions: EdraToolBarCommands[];
}
export declare const GROUPS: Group[];
export default GROUPS;
