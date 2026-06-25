<script lang="ts">
/* region imports */
import { onMount, setContext } from 'svelte';
import EditForm from '$lib/components/form/form.svelte';
import { initForm } from '$lib/form';
import { m } from '$lib/paraglide/messages';
import type { UsersRecord } from '$lib/pocketbase.d';
import { setState } from '$lib/stores';

import type { PageProps } from './$types';

/* endregion imports */

/* region variables */
// props
const { data }: PageProps = $props();
const isAdmin = $derived(!!data.user?.admin);
/* endregion variables */

/* region lifecycle */
// svelte-ignore state_referenced_locally
// Intentional: congregation data is fetched once per load (not reactive to prop changes)
setContext('congregation', data.congregation);

onMount(() => {
  setState({ form: { hasErrors: false, success: false }, loadingSecondary: false });
});
/* endregion lifecycle */

/* region form */
// svelte-ignore state_referenced_locally
// Intentional: forms are initialized once from server data (not reactive to prop changes)
const form = initForm(data.form?.default as unknown as Record<string, unknown>, 'edit', data.user?.admin);

export const snapshot = { capture: form.capture, restore: form.restore };
</script>

<svelte:head>
  <title>{m.editCongregation()} &middot; {m.title()}</title>
</svelte:head>

{#if isAdmin}
  <div class="m-auto mb-4" style="max-width: 480px;">
    <a class="text-muted-foreground text-sm underline-offset-4 hover:underline" href="/admin/congregations"
      >&larr; {m.adminCongregations()}</a
    >
  </div>
{/if}

<EditForm deletion={data.form!.delete} {form} mode="edit" user={data.user as UsersRecord & { id: string }} />
