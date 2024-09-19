<script lang="ts">
	/* region imports */
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { tick, createEventDispatcher } from 'svelte';

	import { t } from '$lib/i18n';
	import { cn } from '$lib/utils';

	import { Button } from '../button';
	import * as Command from '../command';
	import * as Popover from '../popover';
	/*  endregion imports */

	/* region variables */
	// props
	export let items: { label: string; value: string; id: string }[] = [];
	export let placeholder: string | undefined;
	export let value: string | undefined;
	export let attrs: Record<string, any> = {};
	export let disabled: boolean = false;

	// constants
	const dispatch = createEventDispatcher();

	// local variables
	let open = false;
	/* endregion variables */

	/* region methods */
	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
	/* endregion methods */

	/* region reactivity */
	$: selectedValue = items?.find((f) => f.id === value)?.label ?? placeholder;
	/* endregion reactivity */
</script>

<div class="w-full" class:pointer-events-none={disabled} class:opacity-50={disabled}>
	<Popover.Root bind:open let:ids>
		<Popover.Trigger asChild let:builder {...attrs}>
			<Button
				builders={[builder]}
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class="w-full justify-between"
			>
				{selectedValue}
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-96 p-0">
			<Command.Root>
				<Command.Input {placeholder} />
				<Command.Empty>{$t('common.nothingFound')}</Command.Empty>
				<Command.Group>
					<div class="max-h-64 overflow-y-scroll">
						{#if items?.length > 0}
							{#each items as item}
								<Command.Item
									value={item.value}
									onSelect={(currentValue) => {
										value = items.find((i) => i.value === currentValue)?.id;
										dispatch('change', { value: items.find((i) => i.value === currentValue)?.id });
										closeAndFocusTrigger(ids.trigger);
									}}
								>
									<Check class={cn('mr-2 h-4 w-4', value !== item.value && 'text-transparent')} />
									{item.label}
								</Command.Item>
							{/each}
						{/if}
					</div>
				</Command.Group>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
