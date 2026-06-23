<script lang="ts">
  import Form from '$lib/components/form/form.svelte';
  import * as Accordion from '$lib/components/ui/accordion';

  // accept props via normal Svelte API (tests pass props when instantiating the host)
  let { props }: { props: any } = $props();
  const childProps: any = props;
</script>

<Accordion.Root type="single">
  <Form {...childProps} />
</Accordion.Root>
