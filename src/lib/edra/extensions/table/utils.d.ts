import { Editor } from '@tiptap/core';
import { EditorState, Selection, Transaction } from '@tiptap/pm/state';
import { CellSelection, type Rect } from '@tiptap/pm/tables';
import { Node, ResolvedPos } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
export declare const isRectSelected: (rect: Rect) => (selection: CellSelection) => boolean;
export declare const findTable: (selection: Selection) => {
    pos: number;
    start: number;
    depth: number;
    node: Node;
} | undefined;
export declare const isCellSelection: (selection: Selection) => selection is CellSelection;
export declare const isColumnSelected: (columnIndex: number) => (selection: Selection) => boolean;
export declare const isRowSelected: (rowIndex: number) => (selection: Selection) => boolean;
export declare const isTableSelected: (selection: Selection) => boolean;
export declare const getCellsInColumn: (columnIndex: number | number[]) => (selection: Selection) => {
    pos: number;
    start: number;
    node: Node | null | undefined;
}[] | null;
export declare const getCellsInRow: (rowIndex: number | number[]) => (selection: Selection) => {
    pos: number;
    start: number;
    node: Node | null | undefined;
}[] | null;
export declare const getCellsInTable: (selection: Selection) => {
    pos: number;
    start: number;
    node: Node | null;
}[] | null;
export declare const findParentNodeClosestToPos: ($pos: ResolvedPos, predicate: (node: Node) => boolean) => {
    pos: number;
    start: number;
    depth: number;
    node: Node;
} | null;
export declare const findCellClosestToPos: ($pos: ResolvedPos) => {
    pos: number;
    start: number;
    depth: number;
    node: Node;
} | null;
export declare const selectColumn: (index: number) => (tr: Transaction) => Transaction;
export declare const selectRow: (index: number) => (tr: Transaction) => Transaction;
export declare const selectTable: (tr: Transaction) => Transaction;
export declare const isColumnGripSelected: ({ editor, view, state, from }: {
    editor: Editor;
    view: EditorView;
    state: EditorState;
    from: number;
}) => boolean;
export declare const isRowGripSelected: ({ editor, view, state, from }: {
    editor: Editor;
    view: EditorView;
    state: EditorState;
    from: number;
}) => boolean;
