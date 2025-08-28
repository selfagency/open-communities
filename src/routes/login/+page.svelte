<script lang="ts">
  /* region imports */
  import { isEmpty } from 'radashi';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { superForm } from 'sveltekit-superforms';

  import { page } from '$app/state';
  import Login from '$lib/components/login/index.svelte';
  import SignUp from '$lib/components/login/signup.svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import { m } from '$lib/paraglide/messages';
  import { setState } from '$lib/stores';
  import { log } from '$lib/utils';

  import type { PageProps } from './$types';
  /* endregion imports */

  /* region variables */
  // props
  const { data }: PageProps = $props();

  // locals
  let tab: 'login' | 'signup' = $state('login');
  /* endregion variables */

  /* region lifecycle */
  onMount(() => {
    // log.info('login', data);
    if (page.url.searchParams.has('signUp') || page.url.searchParams.has('verifyEmail')) {
      tab = 'signup';
    }

    if (page.url.searchParams.has('resetPassword')) {
      tab = 'login';
    }
  });
  /* endregion lifecycle */

  /* region form */
  const initForm = (data: Record<string, unknown>) => {
    const form = superForm(data, {
      dataType: 'json',
      id: 'signup',
      onError({ result }) {
        // This handles actual server errors (500s, exceptions, etc.)
        log.error('submission error', result.error.message);
        toast.error(m.signUpFailure());
      },
      onResult() {
        setState({ loadingSecondary: false });
      },
      onSubmit() {
        setState({ loadingSecondary: true });
      },
      async onUpdate({ result }) {
        setState({ form: { hasErrors: false, success: false }, loadingSecondary: false });

        if (result.type === 'success') {
          setState({ form: { hasErrors: false, success: true } });
        } else if (result.type === 'failure') {
          // This handles validation failures (fail(400, { form }))
          setState({ form: { hasErrors: true, success: false } });

          // Add detailed error logging
          log.error('signup form validation failed', {
            data: result.data,
            status: result.status,
            type: result.type
          });

          if (!isEmpty(result.data?.form?.errors)) {
            log.error('form field errors', result.data.form.errors);
          }

          // Check if there's a specific error message from the server
          const serverError = result.data?.form?.error;
          if (serverError) {
            log.error('server error message', serverError);
            toast.error(serverError);
          } else if (!isEmpty(result.data?.form?.errors)) {
            // If there are field errors but no general error, show generic message
            toast.error(m.signUpFailure());
          } else {
            // Fallback for unknown validation failure
            toast.error(m.signUpFailure());
          }
        } else {
          // Handle other result types (like 'redirect')
          log.error('unexpected result type', result);
        }
      }
    });

    return form;
  };

  const form = initForm(data.signup);
  export const snapshot = { capture: form.capture, restore: form.restore };
  /*endregion form */
</script>

<svelte:head>
  <title>{m.login()} &middot; {m.title()}</title>
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center" style="min-height: 50vh;">
  <div class="w-full max-w-96">
    <Tabs.Root bind:value={tab}>
      <Tabs.List class="w-full">
        <Tabs.Trigger value="login" class="w-1/2">{m.login()}</Tabs.Trigger>
        <Tabs.Trigger value="signup" class="w-1/2">{m.signUp()}</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="login">
        {#if tab === 'login' && data.login && data.reset}
          <Login data={data.login} reset={data.reset} />
        {/if}
      </Tabs.Content>
      <Tabs.Content value="signup">
        {#if tab === 'signup' && data.signup && data.verify}
          <SignUp {form} verify={data.verify} />
        {/if}
      </Tabs.Content>
    </Tabs.Root>
  </div>
</div>
