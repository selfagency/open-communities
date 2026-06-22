<script lang="ts">
  /* region imports */
  import Welcome from '$lib/components/global/welcome.svelte';
  import Congregations from '$lib/components/search/congregations.svelte';
  import { setState } from '$lib/stores';

  /* endregion imports */

  /* region variables */
  const { data } = $props();

  // Only clear loading when congregations data arrives after a navigation.
  // Using $effect with a change-detection guard prevents misfiring on mount
  // (data.congregations is always truthy — even [] — so the raw condition is
  // vacuously true and would cancel any in-progress progress bar).
  // svelte-ignore state_referenced_locally
  let _prevCongregations = data.congregations;
  $effect(() => {
    if (data.congregations !== _prevCongregations) {
      _prevCongregations = data.congregations;
      setState({ loading: false });
    }
  });
  /* endregion variables */
</script>

<!--
<Dialog.Root {open} onOpenChange={(value) => setState({ showIntro: value })}>
  <Dialog.Content class="max-h-[85vh] max-w-[360px] min-w-[360px] overflow-y-scroll sm:max-w-[540px]">
    <Dialog.Header>
      <Dialog.Title></Dialog.Title>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
-->

<Welcome />
<Congregations />
