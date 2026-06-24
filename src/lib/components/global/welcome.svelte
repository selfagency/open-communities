<script lang="ts">
  /* region imports */
  import { goto } from '$app/navigation';
  import Find from '$lib/assets/find.svg?component';
  import Inclusive from '$lib/assets/inclusive.svg?component';
  import { Button } from '$lib/components/ui/button';
  import { m } from '$lib/paraglide/messages';
  /* endregion imports */
</script>

<div
  class="relative mt-4 mb-16 flex min-h-56 w-full flex-col items-center justify-center rounded-xl bg-muted p-12 sm:mt-12 sm:mb-24 space-y-4">
  <Find aria-hidden="true" class="absolute -top-10 -left-5 hidden w-24 fill-foreground dark:fill-background sm:block  sm:w-32 lg:-left-10" />
  <Inclusive aria-hidden="true" class="absolute -right-5 -bottom-10 hidden w-24 fill-foreground dark:fill-background  sm:block sm:w-32 lg:-right-10" />

  <h1 class="pointer-events-none w-full text-center text-2xl sm:max-w-[80%] sm:text-3xl md:text-4xl lg:text-5xl">
    {m.home_blurb()}
  </h1>

  <Button onclick={async () => await goto('/about')}>{m.learnMore()}</Button>
</div>
