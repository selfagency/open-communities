<script lang="ts">
import { Accordion as AccordionPrimitive } from 'bits-ui';

// Accept and forward props from parent. Keep a minimal any here because
// the underlying bits-ui primitive accepts a variety of props.
let { ref = $bindable(null), value = $bindable(), type, ...restProps }: any = $props();

// Forward props to the underlying primitive. We keep this simple to avoid
// complex rune-derived wiring — the Accordion's props are typically set
// once by the parent and do not require deep reactive coupling here.
const forwardedProps = { ...(type ? { type } : {}), ...restProps } as any;
</script>

<AccordionPrimitive.Root data-slot="accordion" bind:ref bind:value {...forwardedProps} />
