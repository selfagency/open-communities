<script lang="ts">
  /* region imports */

  import { page } from '$app/state';
  import LoginForm from '$lib/components/login/index.svelte';
  import SignUp from '$lib/components/login/signup.svelte';
  import { m } from '$lib/paraglide/messages';
  import { initForm } from '$lib/signup';

  import type { PageProps } from './$types';

  /* endregion imports */

  /* region variables */
  // props
  const { data }: PageProps = $props();

  // locals
  let showingLogin = $derived(
    page.url.searchParams.has('resetPassword') || page.url.searchParams.has('login')
  );
  /* endregion variables */

  /* region form */
  // svelte-ignore state_referenced_locally
  // Intentional: forms are initialized once from server data (not reactive to prop changes)
  const form = initForm(data.signup);
  export const snapshot = { capture: form.capture, restore: form.restore };
  /*endregion form */
</script>

<svelte:head>
  <title>{m.login()} &middot; {m.title()}</title>
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center" style="min-height: 50vh;">
  <div class="w-full max-w-96">
    {#if showingLogin}
      {#if data.login && data.reset}
        <LoginForm data={data.login} reset={data.reset} />
      {/if}
      <p class="mt-4 text-center text-sm text-muted-foreground">
        <button class="text-primary font-semibold underline-offset-4 hover:underline" onclick={() => (showingLogin = false)}>
          Don't have an account? Sign up.
        </button>
      </p>
    {:else}
      {#if data.signup && data.verify}
        <SignUp {form} verify={data.verify} />
      {/if}
    {/if}
  </div>
</div>
