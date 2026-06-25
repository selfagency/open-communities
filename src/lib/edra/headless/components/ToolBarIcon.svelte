<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import type { EdraToolBarCommands } from '../../commands/types.js';

	interface Props {
		editor: Editor;
		command: EdraToolBarCommands;
	}

	const { editor, command }: Props = $props();
</script>

{#snippet ToolBarIcon({ command, editor }: Props)}
	{@const Icon = command.icon}
	<button
		class="edra-command-button"
		class:active={command.isActive?.(editor)}
		onclick={() => command.onClick?.(editor)}
		disabled={command.clickable ? !command.clickable(editor) : false}
		title={`${command.tooltip} ${command.shortCut}`}
	>
		<Icon class="edra-toolbar-icon" />
	</button>
{/snippet}

{@render ToolBarIcon({ command, editor })}
