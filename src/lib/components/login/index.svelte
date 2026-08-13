<script lang="ts">
import posthog from 'posthog-js';
import { fade } from 'svelte/transition';
/* region imports */
import { toast } from 'svelte-sonner';
import type { SuperValidated } from 'sveltekit-superforms';
import { superForm } from 'sveltekit-superforms/client';
import SuperDebug from 'sveltekit-superforms/SuperDebug.svelte';

import { browser, dev } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import Loading from '$lib/components/global/loading.svelte';
import Reset from '$lib/components/login/reset.svelte';
import { Button } from '$lib/components/ui/button';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Card from '$lib/components/ui/card';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Form from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import { m } from '$lib/paraglide/messages';
import { state as appState, setState } from '$lib/stores';
import { log } from '$lib/utils';

/* endregion imports */

/* region variables */
// props
const { data, reset }: { data: SuperValidated<any>; reset: SuperValidated<any> } = $props();

// locals
let resetting: boolean = $state(!!page.url.searchParams.get('resetPassword'));
let resetSuccess: boolean = $state(false);
let sentSuccess: boolean = $state(false);
/* endregion variables */

/* region methods */
const resetter = () => {
  resetting = false;
  resetSuccess = false;
  sentSuccess = false;
};
/* endregion methods */

/* region form */
// svelte-ignore state_referenced_locally
// Intentional: forms are initialized once from server data (not reactive to prop changes)
const form = superForm(data, {
  dataType: 'json',
  id: 'login',
  onError({ result }) {
    log.error(result.error.message);
    toast.error(result.error.message);
  },
  onResult() {
    setState({ loadingSecondary: false });
  },
  onSubmit() {
    setState({ loadingSecondary: true });
  },
  async onUpdate({ result }) {
    setState({ loadingSecondary: false });
    if (result.type === 'success') {
      // Wrap entire success handler so goto('/') always runs even if
      // toast or posthog throws (prevents user from being stuck on login).
      try {
        if (browser && result.data?.user?.id) {
          try {
            posthog.identify(result.data.user.id);
          } catch {
            // PostHog may not be initialized (missing key); non-blocking
          }
        }
        toast.success(m.loginSuccess());
      } catch {
        // Non-blocking — auth cookie is already set; goto navigates anyway.
      }
      await goto('/');
    } else {
      const errorMessage =
        result.data?.form?.error ||
        Object.values(result.data?.form?.errors || {})
          .flat()
          .join(', ') ||
        'Login failed';
      log.error('Login error:', result.data);
      toast.error(errorMessage);
    }
  }
});

const { enhance, form: formData } = form;
/* endregion form */

let loading = $derived(appState.loading);
let loadingSecondary = $derived(appState.loadingSecondary);
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="font-display text-2xl font-normal">
      <span>{resetting ? m.resetPassword() : m.login()}</span>
    </Card.Title>
    <!-- <Card.Description></Card.Description> -->
  </Card.Header>
  <Card.Content>
    {#if loading || loadingSecondary}
      <div
        class="flex h-full min-h-96 w-full flex-col items-center justify-center"
        transition:fade={{ delay: 300, duration: 100 }}
      >
        <Loading />
      </div>
    {:else if resetting}
      {#if !(sentSuccess || resetSuccess)}
        <Reset
          data={reset}
          token={page.url.searchParams.get('resetPassword')}
          bind:reset={resetSuccess}
          bind:sent={sentSuccess}
        />
      {/if}
      {#if sentSuccess && !resetSuccess}
        <div class="flex flex-col items-center justify-center space-y-4">
          <span>{m.emailSent()}</span>
        </div>
      {/if}
      {#if resetSuccess}
        <div class="flex flex-col items-center justify-center space-y-4">
          <span>{m.passwordSuccess()}</span>
          <button onclick={() => resetter()} type="button">{m.continueToLogin()} →</button>
        </div>
      {/if}
    {:else}
      <form action="?/login" class="space-y-2" method="POST" use:enhance>
        <Form.Field {form} name="email">
          <Form.Control>
            {#snippet children(props)}
              <Form.Label>{m.email()}</Form.Label>
              <Input {...props} aria-label={m.email()} autocomplete="email" id="email" bind:value={$formData.email} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="password">
          <Form.Control>
            {#snippet children(props)}
              <Form.Label>{m.password()}</Form.Label>
              <Input
                {...props}
                aria-label={m.password()}
                autocomplete="current-password"
                id="password"
                type="password"
                bind:value={$formData.password}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <div class="mt-4">
          <Form.Button>{m.login()}</Form.Button>
          <Button
            onclick={() => {
              resetting = true;
            }}
            variant="link"
            >{m.forgotPassword()}</Button
          >
        </div>
      </form>
    {/if}

    {#if dev}
      <div class="mt-4"><SuperDebug data={$formData} /></div>
    {/if}
  </Card.Content>
  <!-- <Card.Footer></Card.Footer> -->
</Card.Root>
