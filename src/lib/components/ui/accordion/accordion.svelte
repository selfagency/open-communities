<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in template as AccordionPrimitive.Root
import { Accordion as AccordionPrimitive } from 'bits-ui';

let { ref = $bindable(null), value = $bindable(), ...restProps }: any = $props();
</script>

<AccordionPrimitive.Root type="single" bind:ref bind:value data-slot="accordion" {...restProps} />
