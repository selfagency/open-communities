<script lang="ts">
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Accordion from '$lib/components/ui/accordion';

// accept optional child component and its props via $props() to remain
// compatible with Svelte runes mode used by the test runner
// svelte-ignore state_referenced_locally
const { child: Child = null, props: childProps = {} } = $props() as { child?: any; props?: any };
// svelte-ignore state_referenced_locally
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
