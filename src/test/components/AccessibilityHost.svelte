<script lang="ts">
import Accessibility from '$lib/components/form/segments/accessibility.svelte';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Accordion from '$lib/components/ui/accordion';
export let props: any = {};
const childProps: any = props;
</script>

<Accordion.Root type="single">
  <Accessibility {...childProps} />
</Accordion.Root>
