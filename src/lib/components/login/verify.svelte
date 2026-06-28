<script lang="ts">
/* region imports */
import { isEmpty } from 'radashi';
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import { toast } from 'svelte-sonner';
import { type SuperValidated, superForm } from 'sveltekit-superforms';
import { waitForTheElement } from 'wait-for-the-element';

import { dev } from '$app/environment';
import { m } from '$lib/paraglide/messages';
import { setState } from '$lib/stores';
import { log } from '$lib/utils';

/* endregion imports */

/* region variables */
// props
let {
  data,
  token,
  verified = $bindable(false)
}: { data: SuperValidated<any>; token: null | string; verified: boolean } = $props();
/* endregion variables */

/* region form */
// svelte-ignore state_referenced_locally
// Intentional: form is initialized once from server data (not reactive to prop changes)
const form = superForm(data, {
  dataType: 'json',
  id: 'verify',
  onError({ result }) {
    log.error('submission error', result.error.message);
    toast.error(m.verifyFailure);
  },
  onResult() {
    setState({ loadingSecondary: false });
  },
  onSubmit() {
    setState({ loadingSecondary: true });
  },
  // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
  async onUpdate({ result }) {
    setState({ loadingSecondary: false });
    if (result.type === 'success') {
      verified = true;
    } else {
      if (!isEmpty(result.data.form.errors)) {
        log.error('form errors', result.data.form.errors);
      }
      toast.error(m.verifyFailure);
    }
  }
});

const { enhance, form: formData } = form;
/* endregion form */

/* region lifecycle */
let submitted = $state(false);
onMount(async () => {
  if (submitted) {
    return;
  }
  submitted = true;
  $formData.token = token;
  $formData.type = 'verifyEmail';
  await waitForTheElement('#verify', { timeout: 1000 });
  const formEl = document.getElementById('verify') as HTMLFormElement;
  form.submit(formEl);
});
/* endregion lifecycle */
</script>

<div class="space-y-4" in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
  <div>{m.verifying()}</div>

  {#if $formData.token && $formData.type}
    <form action="?/acct" id="verify" method="POST" use:enhance>
      <input name="token" type="hidden" bind:value={$formData.token} />
      <input name="type" type="hidden" bind:value={$formData.type} />
    </form>
  {/if}

  {#if dev}
    {#await import('sveltekit-superforms') then { default: SuperDebug }}
      <div class="mt-4"><SuperDebug data={$formData} /></div>
    {/await}
  {/if}
</div>
