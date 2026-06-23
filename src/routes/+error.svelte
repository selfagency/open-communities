<script lang="ts">
  /* region imports */
  import { page } from '$app/state';
  import { m } from '$lib/paraglide/messages';
  /* endregion imports */
</script>

<svelte:head>
  <title>{m.errors_error()} &middot; {m.title()}</title>
</svelte:head>

<section class="mx-auto flex min-h-[70vh] w-full flex-col items-center justify-center space-y-6 sm:w-[50%]">
  {#if page.status === 401 || page.status === 403}
    {#await import('$lib/assets/401.svg?component') then { default: Error401 }}
      <Error401 class="mx-auto w-full fill-foreground" />
      <h1 class="text-center text-4xl font-bold">{m.errors_401()}</h1>
    {/await}
  {:else if page.status === 404}
    {#await import('$lib/assets/404.svg?component') then { default: Error404 }}
      <Error404 class="mx-auto w-full fill-foreground" />
      <h1 class="text-center text-4xl font-bold">{m.errors_404()}</h1>
    {/await}
  {:else}
    {#await import('$lib/assets/500.svg?component') then { default: Error500 }}
      <Error500 class="mx-auto w-full max-w-72 fill-foreground" />
      <h1 class="text-center text-4xl font-bold">{m.errors_500()}</h1>
    {/await}
  {/if}
</section>
