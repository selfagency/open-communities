<script lang="ts">
import PlusIcon from '@tabler/icons-svelte/icons/plus';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import Tent from '$lib/assets/tent.svg?component';
import { Button } from '$lib/components/ui/button';
import { m } from '$lib/paraglide/messages';
import { state as appState } from '$lib/stores';
import Menu from './menu.svelte';

const user = $derived(page.data.user);
const isMobile = $derived(appState.isMobile);
</script>

<nav
  class="fixed top-0 left-0 z-60 flex h-18 w-screen min-w-max flex-row items-center justify-between space-x-2 bg-card p-4 shadow"
>
  <div>
    <a class="flex flex-row items-center justify-start space-x-2" href="/">
      <span>
        <Tent class="w-12 fill-foreground sm:w-16" />
      </span>
      <h1 class="mt-2 text-2xl sm:text-4xl">{m.title()}</h1>
    </a>
  </div>

  {#if isMobile}
    <!-- Mobile: only hamburger menu toggle -->
    <Menu mode="mini" />
  {:else}
    <!-- Desktop: Add Congregation + Menu toggle -->
    <div class="flex items-center gap-3">
      <Button
        onclick={async () => {
          if (user?.email) {
            await goto("/add");
          } else {
            await goto("/login?redirect=/add");
          }
        }}
        variant="outline"
      >
        <PlusIcon class="size-4" />
        {m.addCongregation()}
      </Button>

      <Menu mode="full" />
    </div>
  {/if}
</nav>
