<script lang="ts">
  /* region imports */
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import { useId } from "bits-ui";
  import { onMount, tick } from "svelte";
  import { m } from "$lib/paraglide/messages";
  import { cn } from "$lib/utils.js";
  import * as Command from "../ui/command/index.js";
  import * as Popover from "../ui/popover/index.js";

  /*  endregion imports */

  /* region variables */
  // props
  let {
    disabled,
    id,
    items,
    onChange,
    placeholder,
    value = $bindable(""),
  }: {
    disabled?: boolean;
    id?: string;
    items: { id: string; label: string; value: string }[];
    onChange?: (value: string) => void;
    placeholder?: string;
    value?: string;
  } = $props();

  // constants
  const commandGroupId = useId();

  // local variables
  let open = $state(false);
  let triggerRef = $state<HTMLButtonElement>(null!);
  // $derived so the list and label stay in sync when the parent updates the prop
  let currentItems = $derived(items || []);
  let selectedValueLabel = $derived.by(() => {
    const selected = currentItems.find((item) => item.id === value);
    return selected?.label ?? placeholder ?? "";
  });
  let commandsInitialized = $state(false);
  let commandValue = $state("");
  /* endregion variables */

  /* region methods */
  function closeAndFocusTrigger() {
    open = false;
    tick().then(() => {
      triggerRef?.focus();
    });
  }

  function handleCommandValueChange(newValue: string) {
    commandValue = newValue;
  }

  function handleSelect(itemId: string) {
    onChange?.(itemId);
    closeAndFocusTrigger();
  }

  /* endregion methods */

  /* region lifecycle */
  onMount(() => {
    tick().then(() => {
      commandsInitialized = true;
    });
  });
  /* endregion lifecycle */
</script>

<div
  class="w-full"
  class:pointer-events-none={disabled}
  class:opacity-50={disabled}
>
  <Popover.Root bind:open>
    <Popover.Trigger
      {id}
      bind:ref={triggerRef}
      class="button w-full flex-row items-center justify-between! outline bg-white! border-gray-300!"
      role="combobox"
      aria-expanded={open}
    >
      <span>{selectedValueLabel}</span>
      <ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
    </Popover.Trigger>
    <Popover.Content style="width: {triggerRef?.offsetWidth}px;" class="p-0">
      {#if commandsInitialized && currentItems?.length > 0}
        <Command.Root
          value={commandValue}
          onValueChange={handleCommandValueChange}
        >
          <Command.Input {placeholder} class="border-gray-300!" />
          <Command.List>
            <Command.Empty>{m.noResults()}</Command.Empty>
            <Command.Group value={commandGroupId}>
              {#each currentItems as item (item.id)}
                <Command.Item
                  value={item.label}
                  onSelect={() => handleSelect(item.id)}
                >
                  <CheckIcon
                    class={cn(
                      "mr-2 size-4",
                      value !== item.id && "text-transparent",
                    )}
                  />
                  {item.label}
                </Command.Item>
              {/each}
            </Command.Group>
          </Command.List>
        </Command.Root>
      {:else}
        <div class="p-2 text-center text-sm">{m.noOptions()}</div>
      {/if}
    </Popover.Content>
  </Popover.Root>
</div>
