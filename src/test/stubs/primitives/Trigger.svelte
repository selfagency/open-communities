<script lang="ts">
import type { Booleanish } from 'svelte/elements';
// simple button wrapper used for Sheet.Trigger in tests
export let type: 'submit' | 'button' | 'reset' | null | undefined = 'button';
export let ariaExpanded: Booleanish | null | undefined;
export let ariaHaspopup: Booleanish | null | undefined;
export let id: string | undefined;
export let className: string | undefined;
</script>

<button {type} {id} aria-expanded={ariaExpanded} aria-haspopup={ariaHaspopup} class={className} {...$$restProps}>
  <slot />
</button>
