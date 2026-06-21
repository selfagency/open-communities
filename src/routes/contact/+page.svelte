<script lang="ts">
  /* region imports */
  import Contact from '$lib/components/global/contact.svelte';
  import { m } from '$lib/paraglide/messages';

  import type { PageProps, Snapshot } from './$types';
  /* endregion imports */

  /* region variables */
  // props
  const { data }: PageProps = $props();

  // local vars
  let snapshotData = $state('');
  /* endregion variables */

  export const snapshot: Snapshot<string> = {
    capture: () => snapshotData,
    restore: (value) => (snapshotData = value)
  };
</script>

<svelte:head>
  <title>{m.contact_contactUs()} &middot; {m.title()}</title>
</svelte:head>

<section class="flex h-full w-full flex-col items-center justify-center" style="min-height: 50vh;">
  <h1 class="font-display mb-8 text-2xl text-slate-600">{m.contact_contactUs()}</h1>
  <Contact data={data.form} congregations={data.congregations} bind:snapshot={snapshotData} />
</section>
