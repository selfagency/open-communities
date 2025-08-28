<script lang="ts">
  /* region imports */
  import '../app.css';
  import type { Snippet } from 'svelte';

  // import posthog from 'posthog-js';
  import { onMount } from 'svelte';

  import { browser } from '$app/environment';
  import { onNavigate } from '$app/navigation';
  import Footer from '$lib/components/global/footer.svelte';
  import Header from '$lib/components/global/header.svelte';
  import Progress from '$lib/components/global/progress.svelte';
  import { Toaster } from '$lib/components/ui/sonner';
  import { m } from '$lib/paraglide/messages';
  import { setState } from '$lib/stores';

  import type { LayoutData } from './$types';

  // import { log } from '$lib/utils';
  import '../app.css';
  /* endregion imports */

  /* Initialize PostHog pageview and pageleave tracking */
  // if (browser) {
  //   beforeNavigate(() => posthog.capture('$pageleave'));
  //   afterNavigate(() => posthog.capture('$pageview'));
  // }

  /* region variables */
  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  // locals
  let innerWidth = $state(0);
  let innerHeight = $state(0);
  /* endregion variables */

  /* region lifecycle */
  onMount(() => {
    if (browser) {
      document.body.setAttribute('dir', data.user?.lang === 'he' ? 'rtl' : 'ltr');
    }
  });

  onNavigate((navigation) => {
    if (browser) {
      setState({ loading: true });
      if (!document.startViewTransition) return;

      return new Promise((resolve) => {
        document.startViewTransition(async () => {
          resolve();
          await navigation.complete;
          setState({ loading: false });
        });
      });
    }
  });
  /* endregion lifecycle */

  /* region reactivity */
  $effect(() => {
    if (innerWidth > 0) {
      setState({
        isMobile: innerWidth < 640,
        offsetWidth: innerWidth
      });
    }
  });

  $effect(() => {
    if (innerHeight > 0) {
      setState({ offsetHeight: innerHeight });
    }
  });
</script>

<svelte:window bind:innerWidth bind:innerHeight />
<svelte:head>
  <title>{m.title()}</title>
</svelte:head>

<div class="flex h-full min-h-screen flex-col items-center justify-between max-w-screen w-full overflow-hidden">
  <Progress />
  <Header />
  <main class="container mx-auto mt-24 max-w-[1024px] min-w-[300px] p-4">
    {@render children()}
  </main>
  <Footer />
</div>

<Toaster />
