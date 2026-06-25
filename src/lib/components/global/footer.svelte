<script lang="ts">
/* region imports */
import RabbisLogo from '$lib/assets/rabbis4ceasefire.svg?component';
import { m } from '$lib/paraglide/messages';
/* endregion imports */
</script>

<footer class="flex w-full flex-col items-center justify-center space-y-2 py-12">
  <div
    class="flex w-full flex-col items-center justify-center space-y-2 p-4 text-sm text-secondary-foreground sm:flex-row sm:space-y-0 sm:space-x-2 sm:text-base"
  >
    <span class="pointer-events-none flex flex-row items-center justify-center sm:w-1/3 sm:justify-end" translate="no"
      >{m.home_project()}</span
    >
    <span class="flex flex-col items-center justify-center">
      <a href="https://rabbis4ceasefire.com/" target="_blank" translate="no">
        <RabbisLogo class="w-24 fill-secondary-foreground hover:fill-foreground sm:w-36" />
        <span class="sr-only">{m.home_author()} (opens in new tab)</span>
      </a>
    </span>
    <span class="pointer-events-none flex flex-row items-center justify-center font-bold sm:w-1/3 sm:justify-start"
      >{m.home_ceasefire()}
    </span>
  </div>
  <div class="flex w-full flex-row items-center justify-center">
    <span class="flex flex-col items-center justify-center space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
      <span class="flex flex-row items-center justify-center space-x-4">
        <a class="text-xs text-muted-foreground hover:text-muted-foreground" href="/about">
          <span>{m.about()}</span>
        </a>
        <a class="text-xs text-muted-foreground hover:text-muted-foreground" href="/contact">
          <span>{m.contact_contactUs()}</span>
        </a>
        <a class="text-xs text-muted-foreground hover:text-muted-foreground" href="/privacy">
          <span>{m.privacyPolicy()}</span>
        </a>
        <a class="text-xs text-muted-foreground hover:text-muted-foreground" href="/terms">
          <span>{m.termsOfService()}</span>
        </a>
      </span>
      <a
        class="text-xs text-muted-foreground hover:text-muted-foreground"
        href="https://self.agency"
        target="_blank"
        rel="noopener noreferrer"
        translate="no"
      >
        <span>
          {@html m.home_credit({
            thing: 'The Self Agency, LLC'
          })}
        </span>
      </a>
      <a class="text-xs text-muted-foreground hover:text-muted-foreground" href="/site-credits">
        <span>
          {m.siteCredits()}
        </span>
      </a>
    </span>
  </div>
</footer>
