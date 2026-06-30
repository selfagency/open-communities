<script lang="ts">
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
/* region imports */
import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
import { dev } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import Captcha from '$lib/components/global/captcha.svelte';
import Verify from '$lib/components/login/verify.svelte';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Card from '$lib/components/ui/card';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Form from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import { m } from '$lib/paraglide/messages';
import { state as appState, setState } from '$lib/stores';

// import { log } from '$lib/utils';
/* endregion imports */

/* region variables */
// props
let { form, verify }: { form: SuperForm<any>; verify: SuperValidated<any> } = $props();

// locals
let verified: boolean = $state(false);
// let captchaLoaded: boolean = false;

// constants
const verifying = $derived(page.url.searchParams.has('verifyEmail'));

// Svelte 5: derive store values in script to avoid $ prefix in template
let formSuccess = $derived(appState.form?.success);
let redirectUrl = $derived(page.url.searchParams.get('redirect'));

// After successful signup, redirect if a redirect URL was provided
$effect(() => {
  if (formSuccess && redirectUrl) {
    goto(redirectUrl);
  }
});
/* endregion variables */

/* region form */
// svelte-ignore state_referenced_locally
// Intentional: form is initialized once from server data (not reactive to prop changes)
const { enhance, form: formData } = form;
/* endregion form */

/* region lifecycle */
// biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
onMount(async () => {
  setState({ form: { hasErrors: false, success: false }, loadingSecondary: false });
  $formData.emailVisibility = true;
  $formData.lang = 'en';
});
/* endregion lifecycle */
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="font-display text-2xl font-normal">
      {verifying ? m.verifyEmail() : m.signUp()}
    </Card.Title>
    <!-- <Card.Description></Card.Description> -->
  </Card.Header>
  <Card.Content>
    {#if verifying && !verified}
      <Verify data={verify} token={page.url.searchParams.get('verifyEmail')} bind:verified />
    {:else if verified}
      <span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
        {m.verified_extended()}
      </span>
    {:else if formSuccess}
      <span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
        {m.signUpSuccess()}
      </span>
    {:else}
      <div class="mb-4">{m.signUpInfo()}</div>

      <form
        action="?/signup"
        class="space-y-2"
        method="POST"
        use:enhance
        in:fade={{ delay: 200, duration: 100 }}
        out:fade={{ delay: 0, duration: 100 }}
      >
        <Form.Field {form} name="name">
          <Form.Control>
            {#snippet children(props)}
              <Form.Label>{m.name()}</Form.Label>
              <Input {...props} id="signup-name" aria-label={m.name()} autocomplete="name" bind:value={$formData.name} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="email">
          <Form.Control>
            {#snippet children(props)}
              <Form.Label>{m.email()}</Form.Label>
              <Input {...props} id="signup-email" aria-label={m.email()} autocomplete="email" bind:value={$formData.email} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="password">
          <Form.Control>
            {#snippet children(props)}
              <Form.Label>{m.password()}</Form.Label>
              <Input {...props} id="signup-password" aria-label={m.password()} autocomplete="new-password" type="password" bind:value={$formData.password} />
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
              <Input {...props} id="signup-password-confirm" aria-label={m.confirmPassword()} autocomplete="new-password" type="password" bind:value={$formData.passwordConfirm} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Captcha {form} />

        <div class="mt-4 flex items-center justify-between">
          <Form.Button>{m.signUp()}</Form.Button>
          <a class="text-primary text-sm font-semibold underline-offset-4 hover:underline" href="/login?login"
            >{m.alreadyHaveAccount()}</a
          >
        </div>
      </form>

      {#if dev}
        {#await import('sveltekit-superforms') then { default: SuperDebug }}
          <div class="mt-4"><SuperDebug data={$formData} /></div>
        {/await}
      {/if}
    {/if}
  </Card.Content>
</Card.Root>
