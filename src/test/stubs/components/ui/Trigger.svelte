<script lang="ts">
import { getContext } from 'svelte';

type SheetContext = {
  toggle?: () => void;
};

const ctx = getContext<SheetContext>('TEST_SHEET');

const toggle = typeof ctx?.toggle === 'function' ? ctx.toggle : () => {};
</script>

<button on:click={() => toggle()} {...$$restProps}>
  <slot />
</button>
