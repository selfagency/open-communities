import { Extension } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
export interface GlobalDragHandleOptions {
  /**
   * The width of the drag handle
   */
  dragHandleWidth: number;
  /**
   * The treshold for scrolling
   */
  scrollTreshold: number;
  dragHandleSelector?: string;
  /**
   * Tags to be excluded for drag handle
   */
  excludedTags: string[];
  /**
   * Custom nodes to be included for drag handle
   */
  customNodes: string[];
  /**
   * onNodeChange callback for drag handle
   * @param data
   * @returns
   */
  onMouseMove?: (data: { node: Node; pos: number }) => void;
}
export declare function DragHandlePlugin(
  options: GlobalDragHandleOptions & {
    pluginKey: string;
  }
): Plugin<any>;
declare const GlobalDragHandle: Extension<any, any>;
export default GlobalDragHandle;
