<script lang="ts">
	import GripVerticalIcon from "@tabler/icons-svelte/icons/grip-vertical";
	import type { Attachment } from "svelte/attachments";
	import { Button } from "$lib/components/ui/button/index.js";

	let { attach }: { attach?: Attachment } = $props();
</script>

<Button
	{@attach attach}
	variant="ghost"
	size="icon"
	class="text-muted-foreground size-7 hover:bg-transparent"
>
	<GripVerticalIcon class="text-muted-foreground size-3" />
	<span class="sr-only">Drag to reorder</span>
</Button>
