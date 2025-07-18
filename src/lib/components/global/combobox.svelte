<script lang="ts">
	/* region imports */
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { createEventDispatcher, tick } from 'svelte';

	import { cn } from '$lib/utils.js';

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

	// local variables
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	let currentItems = $state(items || []);
	let selectedValueLabel = $state(placeholder || '');
	/* endregion variables */

	/* region methods */
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}

	function handleSelect(itemId: string) {
		dispatch('change', { value: itemId });
		closeAndFocusTrigger();
	}

	function updateSelectedValue() {
		const selected = items?.find((item) => item.id === value);
		selectedValueLabel = selected?.label ?? placeholder ?? '';
	}
	/* endregion methods */

	/* region reactivity */
	$effect(() => {
		// Update the items list when items prop changes
		if (items) {
			currentItems = [...items];
			updateSelectedValue();
		}
	});
	/* endregion reactivity */
</script>

<div class="w-full" class:pointer-events-none={disabled} class:opacity-50={disabled}>
	<Popover.Root bind:open>
		<Popover.Trigger
			bind:ref={triggerRef}
			class="button w-full justify-between"
			role="combobox"
			aria-expanded={open}
		>
			{selectedValueLabel}
			<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
		</Popover.Trigger>
		<Popover.Content class="w-full p-0">
			{#if currentItems.length > 0}
				<Command.Root>
					<Command.Input {placeholder} />
					<Command.List>
						<Command.Empty>No results found.</Command.Empty>
						<Command.Group>
							{#each currentItems as item (item.id)}
								<Command.Item value={item.label} onSelect={() => handleSelect(item.id)}>
									<CheckIcon class={cn('mr-2 size-4', value !== item.id && 'text-transparent')} />
									{item.label}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			{:else}
				<div class="p-2 text-center text-sm">No options available</div>
			{/if}
		</Popover.Content>
	</Popover.Root>
</div>
