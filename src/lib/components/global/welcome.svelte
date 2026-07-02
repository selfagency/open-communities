<script lang="ts">
  /* region imports */
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import { m } from "$lib/paraglide/messages";
  import Crowd from "$lib/assets/crowd.png";
  /* endregion imports */
</script>

<div
  class="relative mt-4 mb-16 min-h-150 flex w-full flex-col items-center justify-end rounded-xl p-12 sm:mt-12 sm:mb-24 space-y-4"
>
  <div
    class="absolute inset-0 rounded-xl bg-cover bg-bottom"
    style="background-image: url({Crowd})"
  ></div>
  <div class="absolute inset-0 rounded-xl bg-muted/60"></div>
  <h1
    class="pointer-events-none relative z-10 w-full text-center text-2xl sm:max-w-[80%] sm:text-3xl md:text-4xl lg:text-5xl text-white text-shadow-2xs"
  >
    {m.home_blurb()}
  </h1>

  <Button
    class="relative z-10"
    onclick={async () => await goto("/about")}
    variant="outline"
  >
    {m.learnMore()}
  </Button>
</div>
