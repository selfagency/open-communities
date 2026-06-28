<script lang="ts">
import { getContext } from 'svelte';

interface SheetContext {
  toggle?: () => void;
}

const ctx = getContext<SheetContext>('TEST_SHEET');

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
const toggle = typeof ctx?.toggle === 'function' ? ctx.toggle : () => {};
</script>

<button on:click={() => toggle()} {...$$restProps}>
  <slot />
</button>
