<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { cn } from '../../utils.js';
	import initEditor from '../editor.js';
	import type { EdraEditorProps } from '../types.js';
	import { focusEditor } from '../utils.js';
	import '../editor.css';
	import './style.css';
	import '../onedark.css';
	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import { all, createLowlight } from 'lowlight';
	import { SvelteNodeViewRenderer } from 'svelte-tiptap';
	import { AudioExtended } from '../extensions/audio/AudiExtended.js';
	import { AudioPlaceholder } from '../extensions/audio/AudioPlaceholder.js';
	import { IFrameExtended } from '../extensions/iframe/IFrameExtended.js';
	import { IFramePlaceholder } from '../extensions/iframe/IFramePlaceholder.js';
	import { ImageExtended } from '../extensions/image/ImageExtended.js';
	import { ImagePlaceholder } from '../extensions/image/ImagePlaceholder.js';
	import slashcommand from '../extensions/slash-command/slashcommand.js';
	import { VideoExtended } from '../extensions/video/VideoExtended.js';
	import { VideoPlaceholder } from '../extensions/video/VideoPlaceholder.js';
	import AudioExtendedComp from './components/AudioExtended.svelte';
	import AudioPlaceHolderComp from './components/AudioPlaceHolder.svelte';
	import CodeBlock from './components/CodeBlock.svelte';
	import IFrameExtendedComp from './components/IFrameExtended.svelte';
	import IFramePlaceHolderComp from './components/IFramePlaceHolder.svelte';
	import ImageExtendedComp from './components/ImageExtended.svelte';
	import ImagePlaceholderComp from './components/ImagePlaceholder.svelte';
	import SlashCommandList from './components/SlashCommandList.svelte';
	import VideoExtendedComp from './components/VideoExtended.svelte';
	import VideoPlaceHolderComp from './components/VideoPlaceholder.svelte';
	import Link from './menus/Link.svelte';
	import TableCol from './menus/TableCol.svelte';
	import TableRow from './menus/TableRow.svelte';

	const lowlight = createLowlight(all);

	/**
	 * Bind the element to the editor
	 */
	let element = $state<HTMLElement>();
	let {
		editor = $bindable(),
		editable = true,
		content,
		onUpdate,
		autofocus = false,
		class: className
	}: EdraEditorProps = $props();

	onMount(() => {
		editor = initEditor(
			element,
			content,
			[
				CodeBlockLowlight.configure({
					lowlight
				}).extend({
					addNodeView() {
						return SvelteNodeViewRenderer(CodeBlock);
					}
				}),
				ImagePlaceholder(ImagePlaceholderComp),
				ImageExtended(ImageExtendedComp),
				VideoPlaceholder(VideoPlaceHolderComp),
				VideoExtended(VideoExtendedComp),
				AudioPlaceholder(AudioPlaceHolderComp),
				AudioExtended(AudioExtendedComp),
				IFramePlaceholder(IFramePlaceHolderComp),
				IFrameExtended(IFrameExtendedComp),
				slashcommand(SlashCommandList)
			],
			{
				onUpdate,
				onTransaction(props) {
					editor = undefined;
					editor = props.editor;
				},
				editable,
				autofocus
			}
		);
	});

	onDestroy(() => {
		if (editor) editor.destroy();
	});
</script>

{#if editor && !editor.isDestroyed}
	<Link {editor} />
	<TableCol {editor} />
	<TableRow {editor} />
{/if}
<div
	bind:this={element}
	role="button"
	tabindex="0"
	onclick={(event) => focusEditor(editor, event)}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			focusEditor(editor, event);
		}
	}}
	class={cn('edra-editor h-full w-full cursor-auto *:outline-none', className)}
></div>
