<script lang="ts">
/* region imports */
import '../app.css';

import { ModeWatcher } from 'mode-watcher';
import posthog from 'posthog-js';
import type { Snippet } from 'svelte';
import { onMount, untrack } from 'svelte';
import { browser } from '$app/environment';
import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
import Footer from '$lib/components/global/footer.svelte';
import Header from '$lib/components/global/header.svelte';
import Progress from '$lib/components/global/progress.svelte';
import { Toaster } from '$lib/components/ui/sonner';
import { m } from '$lib/paraglide/messages';
import { setState } from '$lib/stores';

import type { LayoutData } from './$types';

/* endregion imports */

/* Initialize PostHog pageview and pageleave tracking */
if (browser) {
  beforeNavigate(() => posthog.capture('$pageleave'));
  afterNavigate(() => posthog.capture('$pageview'));
}

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

    if (!document.startViewTransition) {
      // No view transitions: set loading=false when navigation completes
      navigation.complete.then(() => setState({ loading: false }));
      return;
    }

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
    untrack(() =>
      setState({
        isMobile: innerWidth < 768,
        offsetWidth: innerWidth
      })
    );
  }
});

$effect(() => {
  if (innerHeight > 0) {
    untrack(() => setState({ offsetHeight: innerHeight }));
  }
});
</script>

<svelte:window bind:innerHeight bind:innerWidth />
<svelte:head>
  <title>{m.title()}</title>
</svelte:head>

<a
  class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
  href="#main-content"
>
  {m.skipToMain()}
</a>

<div class="flex h-full min-h-screen flex-col items-center justify-between max-w-screen w-full overflow-hidden">
  {#if data.offline}
    <div
      class="fixed top-0 z-50 flex w-full items-center justify-center bg-amber-500/90 px-4 py-2 text-sm font-medium text-amber-950 backdrop-blur-sm"
      role="alert"
    >
      {m.reconnecting()}
    </div>
  {/if}
  <Progress />
  <Header />
  <main class="container mx-auto mt-24 max-w-[1024px] min-w-[300px] p-4" id="main-content" class:mt-28={data.offline}>
    {@render children()}
  </main>
  <Footer />
</div>

<ModeWatcher />
<Toaster />
