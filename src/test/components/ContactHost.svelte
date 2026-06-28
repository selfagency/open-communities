<script lang="ts">
import Contact from '$lib/components/form/segments/contact.svelte';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Accordion from '$lib/components/ui/accordion';
export let props: any = {};
const childProps: any = props;
</script>

<Accordion.Root type="single">
  <Contact {...childProps} />
</Accordion.Root>
