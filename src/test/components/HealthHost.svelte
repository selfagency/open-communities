<script lang="ts">
import Health from '$lib/components/form/segments/health.svelte';
import * as Accordion from '$lib/components/ui/accordion';
export let props: any = {};
const childProps: any = props;
</script>

<Accordion.Root type="single">
  <Health {...childProps} />
</Accordion.Root>
