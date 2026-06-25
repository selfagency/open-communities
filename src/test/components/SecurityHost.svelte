<script lang="ts">
import Security from '$lib/components/form/segments/security.svelte';
import * as Accordion from '$lib/components/ui/accordion';
export let props: any = {};
const childProps: any = props;
</script>

<Accordion.Root type="single">
  <Security {...childProps} />
</Accordion.Root>
