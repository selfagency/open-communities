<script lang="ts">
import Fit from '$lib/components/form/segments/fit.svelte';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Accordion from '$lib/components/ui/accordion';
export let props: any = {};
const childProps: any = props;
</script>

<Accordion.Root type="single">
  <Fit {...childProps} />
</Accordion.Root>
