<script lang="ts">
  /* region imports */
  import { onMount, setContext } from 'svelte';

  import type { UsersRecord } from '$lib/pocketbase.d';

  import EditForm from '$lib/components/form/form.svelte';
  import { initForm } from '$lib/form';
  import { m } from '$lib/paraglide/messages';
  import { setState } from '$lib/stores';

  import type { PageProps } from './$types';
  /* endregion imports */

  /* region variables */
  // props
  const { data }: PageProps = $props();
  /* endregion variables */

  /* region lifecycle */
  setContext('congregation', data.congregation);

  onMount(() => {
    setState({ form: { hasErrors: false, success: false }, loadingSecondary: false });
  });
  /* endregion lifecycle */

  const form = initForm(data.form.default, 'edit', data.user?.admin);

  export const snapshot = { capture: form.capture, restore: form.restore };
</script>

<svelte:head>
  <title>{m.editCongregation()} &middot; {m.title()}</title>
</svelte:head>

<EditForm
  {form}
  mode="edit"
  deletion={data.form.delete}
  transfer={data.form.transfer}
  user={data.user as UsersRecord & { id: string }} />
