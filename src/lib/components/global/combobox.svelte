<script lang="ts">
  /* region imports */
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import { useId } from 'bits-ui';
  import { createEventDispatcher, onMount, tick, untrack } from 'svelte';

  import { cn } from '$lib/utils.js';

  import * as Command from '../ui/command/index.js';
  import * as Popover from '../ui/popover/index.js';
  /*  endregion imports */

  /* region variables */
  // props
  let {
    disabled,
    id,
    items,
    placeholder,
    value = $bindable('')
  }: {
    disabled?: boolean;
    id?: string;
    items: { id: string; label: string; value: string }[];
    placeholder?: string;
    value?: string;
  } = $props();

  // constants
  const dispatch = createEventDispatcher();
  const commandGroupId = useId();

  // local variables
  let open = $state(false);
  let triggerRef = $state<HTMLButtonElement>(null!);
  let currentItems = $state(items || []);
  let selectedValueLabel = $state(placeholder || '');
  let commandsInitialized = $state(false);
  let commandValue = $state('');
  /* endregion variables */

  /* region methods */
  function closeAndFocusTrigger() {
    open = false;
    tick().then(() => {
      triggerRef?.focus();
    });
  }

  function handleCommandValueChange(newValue) {
    commandValue = newValue;
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

  /* region lifecycle */
	onMount(() => {
		tick().then(() => {
			commandsInitialized = true;
		});
	});
  /* endregion lifecycle */

  /* region reactivity */
  $effect(() => {
    // Update the items list when items prop changes
    if (items) {
      untrack(() => {
        currentItems = [...items];
        updateSelectedValue();
      });
    }
  });
  /* endregion reactivity */
</script>

<div class="w-full" class:pointer-events-none={disabled} class:opacity-50={disabled}>
  <Popover.Root bind:open>
    <Popover.Trigger
      {id}
      bind:ref={triggerRef}
      class="button w-full flex-row items-center !justify-between outline"
      role="combobox"
      aria-expanded={open}>
      <span>{selectedValueLabel}</span>
      <ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
    </Popover.Trigger>
    <Popover.Content style="width: {triggerRef?.offsetWidth}px;" class="p-0">
      {#if commandsInitialized && currentItems?.length > 0}
        <Command.Root value={commandValue} onValueChange={handleCommandValueChange}>
          <Command.Input {placeholder} />
          <Command.List>
            <Command.Empty>No results found.</Command.Empty>
            <Command.Group value={commandGroupId}>
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
