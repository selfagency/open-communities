<script lang="ts">
  import Congregation from '$lib/components/form/segments/congregation.svelte';
  import * as Accordion from '$lib/components/ui/accordion';

  // svelte-ignore state_referenced_locally
  let { props }: { props: any } = $props();
  // svelte-ignore state_referenced_locally
  const childProps: any = props;
</script>

<Accordion.Root type="single">
  <div>Before</div>
  <Congregation {...childProps} />
</Accordion.Root>