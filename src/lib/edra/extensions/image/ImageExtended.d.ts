import type { Node, NodeViewProps } from '@tiptap/core';
import { type ImageOptions } from '@tiptap/extension-image';
import type { Component } from 'svelte';
export declare const ImageExtended: (component: Component<NodeViewProps>) => Node<ImageOptions, unknown>;
