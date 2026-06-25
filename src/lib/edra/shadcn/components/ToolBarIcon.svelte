<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import Button from '../../../components/ui/button/button.svelte';
	import { cn } from '../../../utils.js';
	import type { EdraToolBarCommands } from '../../commands/types.js';
	import EdraToolTip from './EdraToolTip.svelte';

	interface Props {
		editor: Editor;
		command: EdraToolBarCommands;
	}

	const { editor, command }: Props = $props();
</script>

<EdraToolTip tooltip={command.tooltip ?? ''} shortCut={command.shortCut ?? ''}>
	<Button
		variant="ghost"
		size="icon"
		class={cn(command.isActive?.(editor) && 'bg-muted')}
		onclick={() => command.onClick?.(editor)}
		disabled={command.clickable ? !command.clickable(editor) : false}
	>
		{@const Icon = command.icon}
		<Icon />
	</Button>
</EdraToolTip>
