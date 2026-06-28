<script lang="ts">
import Form from '$lib/components/form/form.svelte';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Accordion from '$lib/components/ui/accordion';

// accept props via normal Svelte API (tests pass props when instantiating the host)
// svelte-ignore state_referenced_locally
let { props }: { props: any } = $props();
// svelte-ignore state_referenced_locally
const childProps: any = props;
</script>

<Accordion.Root type="single">
  <Form {...childProps} />
</Accordion.Root>
