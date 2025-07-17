<script lang="ts">
	/* region imports */
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { createEventDispatcher, tick } from 'svelte';

	import { cn } from '$lib/utils.js';

	import { Button } from '../ui/button/index.js';
	import * as Command from '../ui/command/index.js';
	import * as Popover from '../ui/popover/index.js';
	/*  endregion imports */

	/* region variables */
	// props
	let {
		disabled,
		items,
		placeholder,
		value = $bindable('')
	}: {
		disabled?: boolean;
		items: { id: string; label: string; value: string }[];
		placeholder?: string;
		value?: string;
	} = $props();

	// constants
	const dispatch = createEventDispatcher();
	const selectedValue = $derived(items?.find((f) => f.id === value)?.label ?? placeholder);

	// local variables
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	/* endregion variables */

	/* region methods */
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
	/* endregion methods */
</script>

<div class="w-full" class:pointer-events-none={disabled} class:opacity-50={disabled}>
	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				<Button
					variant="outline"
					class="w-[200px] justify-between"
					{...props}
					role="combobox"
					aria-expanded={open}
				>
					{selectedValue || 'Select a framework...'}
					<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-[200px] p-0">
			<Command.Root>
				<Command.Input placeholder="Search framework..." />
				<Command.List>
					<Command.Empty>No framework found.</Command.Empty>
					<Command.Group>
						{#each items as item, i (i)}
							<Command.Item
								value={item.value}
								onSelect={() => {
									value = item.value;
									dispatch('change', { value: items.find((i) => i.value === item.value)?.id });
									closeAndFocusTrigger();
								}}
							>
								<CheckIcon class={cn('mr-2 size-4', value !== item.value && 'text-transparent')} />
								{item.label}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
