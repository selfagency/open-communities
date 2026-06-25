import { type Snippet } from 'svelte';
import type { NodeViewProps } from '@tiptap/core';
interface MediaExtendedProps extends NodeViewProps {
    children: Snippet<[]>;
    mediaRef?: HTMLElement;
}
declare const MediaExtended: import("svelte").Component<MediaExtendedProps, {}, "mediaRef">;
type MediaExtended = ReturnType<typeof MediaExtended>;
export default MediaExtended;
