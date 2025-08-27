<script lang="ts">
  import * as Accordion from '$lib/components/ui/accordion';
  // accept optional child component and its props via $props() to remain
  // compatible with Svelte runes mode used by the test runner
  const { child: Child = null, props: childProps = {} } = $props() as { child?: any; props?: any };
  const childPropsAny: any = childProps;
</script>

<Accordion.Root type="single">
  <!-- mount point for tests that need to instantiate a child component inside the accordion context -->
  <div data-test="accordion-mount">
    {#if Child}
      <!-- dynamic components are default in runes mode -->
      <Child {...childPropsAny} />
    {/if}
  </div>
</Accordion.Root>
