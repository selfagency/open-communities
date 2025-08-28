<script lang="ts">
  /* region imports */
  import Welcome from '$lib/components/global/welcome.svelte';
  import Congregations from '$lib/components/search/congregations.svelte';
  // import * as Dialog from '$lib/components/ui/dialog';
  // import { m } from '$lib/paraglide/messages';
  // import { state as appState, setState } from '$lib/stores';
  import { setState } from '$lib/stores';
  // import { log } from '$lib/utils';
  /* endregion imports */

  /* region variables */
  // props
  const { data } = $props();

  // const open = $derived($appState?.showIntro);
  /* endregion variables */

  $effect(() => {
    if (data.congregations) {
      setState({ loading: false });
    }
  });
</script>

<!--
<Dialog.Root {open} onOpenChange={(value) => setState({ showIntro: value })}>
  <Dialog.Content class="max-h-[85vh] max-w-[360px] min-w-[360px] overflow-y-scroll sm:max-w-[540px]">
    <Dialog.Header>
      <Dialog.Title class="font-display text-2xl font-normal">
        {m.home_dialogTitle()}
      </Dialog.Title>
      <Dialog.Description>
        <section class="prose mx-auto my-4">
          {@html data.content.content}
        </section>
      </Dialog.Description>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
 -->

<Welcome />

<Congregations />
