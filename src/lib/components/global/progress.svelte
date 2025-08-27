<script lang="ts">
  /* region imports */
  import { onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';

  import { Progress } from '$lib/components/ui/progress';
  import { state as appState } from '$lib/stores';
  /* endregion imports */

  /* region variables */
  // local vars
  let progress: number = $state(0);
  let progressInterval: null | ReturnType<typeof setInterval> = $state(null);
  let isProgressActive = $state(false);
  let isProgressVisible = $state(false);
  /* endregion variables */

  /* region methods */
  const startProgress = () => {
    progress = 0;
    isProgressVisible = true;
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += (90 - progress) / 25;
      } else {
        progress += 0.05;
      }

      if (progress >= 99 && progressInterval) {
        clearInterval(progressInterval);
      }
    }, 100);
  };

  const finishProgress = () => {
    if (progressInterval) clearInterval(progressInterval);
    progress = 99.9;
    setTimeout(() => {
      progress = 100;
      setTimeout(() => {
        setTimeout(() => {
          isProgressActive = false;
          isProgressVisible = false;
        }, 500);
        progress = 0;
      }, 500);
    }, 50);
  };
  /* endregion methods */

  /* region lifecycle */
  onDestroy(() => {
    if (progressInterval) clearInterval(progressInterval);
  });
  /* endregion lifecycle */

  /* region reactivity */
  $effect(() => {
    if ($appState.loading && !isProgressActive) {
      isProgressActive = true;
      startProgress();
    }
  });

  $effect(() => {
    if (!$appState.loading && isProgressActive) {
      finishProgress();
    }
  });
  /* endregion reactivity */
</script>

{#if isProgressVisible}
  <div id="nav-progress" in:fade class="fixed top-0 left-0 z-50 w-screen">
    <Progress value={progress} class="rounded-none" />
  </div>
{/if}
