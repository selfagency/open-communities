<script lang="ts">
/* region imports */
import Tent from '$lib/assets/tent.svg?component';
import { m } from '$lib/paraglide/messages';

import Nav from './nav.svelte';
/*  endregion imports */
</script>

<nav
  class="fixed top-0 left-0 z-40 flex h-18 w-screen min-w-max flex-row items-center justify-between space-x-2 bg-background p-4 shadow"
>
  <div>
    <a class="flex flex-row items-center justify-start space-x-2" href="/">
      <span>
        <Tent class="w-12 fill-foreground sm:w-16" />
      </span>
      <h1 class="mt-2 text-2xl sm:text-4xl">{m.title()}</h1>
    </a>
  </div>
  <div>
    <Nav />
  </div>
</nav>
