<script lang="ts">
import Services from '$lib/components/form/segments/services.svelte';
import * as Accordion from '$lib/components/ui/accordion';
export let props: any = {};
const childProps: any = props;
</script>

<Accordion.Root type="single">
  <Services {...childProps} />
</Accordion.Root>
