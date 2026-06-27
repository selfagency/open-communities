<script lang="ts">
/* region imports */
import { onDestroy, untrack } from 'svelte';
import { fade } from 'svelte/transition';

import { Progress } from '$lib/components/ui/progress';
import { state as appState } from '$lib/stores';

/* endregion imports */

let progress: number = $state(0);
let progressInterval: null | ReturnType<typeof setInterval> = null;
let isProgressActive = $state(false);
let isProgressVisible = $state(false);

const startProgress = () => {
  progress = 0;
  isProgressVisible = true;
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  progressInterval = setInterval(() => {
    progress = progress < 90 ? progress + (90 - progress) / 25 : progress + 0.05;
    if (progress >= 99 && progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }, 100);
};

const finishProgress = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
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

onDestroy(() => {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
});

// Effect 1: start progress when loading begins.
$effect(() => {
  if (appState.loading && !isProgressActive) {
    untrack(() => {
      isProgressActive = true;
      startProgress();
    });
  }
});

// Effect 2: finish progress when loading ends.
$effect(() => {
  if (!appState.loading && isProgressActive) {
    untrack(() => {
      finishProgress();
    });
  }
});
</script>

{#if isProgressVisible}
  <div class="fixed top-0 left-0 z-[70] w-screen" id="nav-progress" in:fade>
    <Progress class="rounded-none" value={progress} />
  </div>
{/if}
