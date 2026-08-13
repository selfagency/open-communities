<script lang="ts">
import { isEmpty } from 'radashi';
/* region imports */
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import { toast } from 'svelte-sonner';
import type { SuperValidated } from 'sveltekit-superforms';
import { superForm } from 'sveltekit-superforms/client';
import SuperDebug from 'sveltekit-superforms/SuperDebug.svelte';
import { waitForTheElement } from 'wait-for-the-element';

import { dev } from '$app/environment';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Form from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import { m } from '$lib/paraglide/messages';
import { log } from '$lib/utils';

/* endregion imports */

/* region variables */
// props
let {
  data,
  reset = $bindable(false),
  sent = $bindable(false),
  token
}: {
  data: SuperValidated<any>;
  reset?: boolean;
  sent?: boolean;
  token: null | string;
} = $props();
/* endregion variables */

/* region form */
// svelte-ignore state_referenced_locally
// Intentional: form is initialized once from server data (not reactive to prop changes)
const form = superForm(data, {
  dataType: 'json',
  id: 'reset',
  onError({ result }) {
    log.error('submission error', result.error.message);
    toast.error(result.error.message);
  },
  // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
  async onUpdate({ result }) {
    if (result.type === 'success') {
      if ($formData.type === 'resetPassword') {
        reset = true;
      }
      if ($formData.type === 'requestReset') {
        sent = true;
      }
    } else {
      if (!isEmpty(result.data.form.errors)) {
        log.error('form errors', result.data.form.errors);
      }
      if (!isEmpty(result.data.form.errors)) {
        log.error('submission error', result.data.form.errors);
      }
      toast.error(m.resetFailure);
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
  $formData.token = token ? token : 'invalid';
  $formData.type = token ? 'resetPassword' : 'requestReset';
  await waitForTheElement('#reset', { timeout: 1000 });
  const formEl = document.getElementById('reset') as HTMLFormElement;
  form.submit(formEl);
});
/* endregion lifecycle */
</script>

<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
  <form action="?/acct" id="verify" method="POST" use:enhance>
    <input name="token" type="hidden" bind:value={$formData.token} />
    <input name="type" type="hidden" bind:value={$formData.type} />

    {#if $formData.type === 'resetPassword'}
      <Form.Field {form} name="password">
        <Form.Control>
          {#snippet children(props)}
            <Form.Label>{m.password()}</Form.Label>
            <Input {...props} autocomplete="new-password" required bind:value={$formData.password} />
          {/snippet}
        </Form.Control>
        <Form.Description>
          {m.passwordRequirements()}
        </Form.Description>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="passwordConfirm">
        <Form.Control>
          {#snippet children(props)}
            <Form.Label>{m.confirmPassword()}</Form.Label>
            <Input
              {...props}
              autocomplete="new-password"
              required
              type="password"
              bind:value={$formData.passwordConfirm}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Button>{m.resetPassword()}</Form.Button>
    {:else}
      <p class="mb-4">{m.resetNotice()}</p>

      <Form.Field {form} name="email">
        <Form.Control>
          {#snippet children(props)}
            <Form.Label>{m.email()}</Form.Label>
            <Input {...props} autocomplete="email" required bind:value={$formData.email} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Button>{m.sendResetEmail()}</Form.Button>
    {/if}
  </form>

  {#if dev}
    <div class="mt-4"><SuperDebug data={$formData} /></div>
  {/if}
</span>
