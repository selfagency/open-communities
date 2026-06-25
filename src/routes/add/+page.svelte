<script lang="ts">
  import { onMount } from 'svelte';
  import AddForm from '$lib/components/form/form.svelte';
  import { initForm } from '$lib/form';
  import { m } from '$lib/paraglide/messages';
  /* region imports */
  import type { UsersRecord } from '$lib/pocketbase.d';
  import { setState } from '$lib/stores';

  import type { PageProps } from './$types';

  /* endregion imports */

  /* region variables */
  // props
  const { data }: PageProps = $props();

  // svelte-ignore state_referenced_locally
  // Intentional: form is initialized once from server data (not reactive to prop changes)
  const form = initForm(data.form?.default as unknown as Record<string, unknown>, 'add', data.user?.admin);

  export const snapshot = { capture: form.capture, restore: form.restore };
  /*endregion variables */

  /* region lifecycle */
  onMount(() => {
    setState({ form: { hasErrors: false, success: false }, loadingSecondary: false });
  });
  /*endregion lifecycle */
</script>

<svelte:head>
  <title>{m.addCongregation()} &middot; {m.title()}</title>
</svelte:head>

<AddForm {form} content={data.content} mode="add" deletion={undefined} user={data.user as UsersRecord & { id: string }} />
