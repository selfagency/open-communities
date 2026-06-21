<script lang="ts">
  /* region imports */
  import { onMount } from 'svelte';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { initState } from '$lib/stores';
  /* endregion imports */

  /* region lifecycle */
  onMount(async () => {
    if (browser) {
      initState();
      await fetch('?/logout', { body: new FormData(), method: 'POST' });
      // eslint-disable-next-line svelte/no-navigation-without-resolve
      await goto('/');
      window.location.reload();
    }
  });
  /* endregion lifecycle */
</script>
