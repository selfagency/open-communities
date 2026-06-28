<script lang="ts">
import EmailIcon from '@tabler/icons-svelte/icons/mail';
/* region imports */
import WebIcon from '@tabler/icons-svelte/icons/world';
import { Button } from '$lib/components/ui/button';
import { m } from '$lib/paraglide/messages';
import type { RegistrationRecord } from '$lib/pocketbase.d';

/* endregion imports */

/* region variables */
// props
const { registration }: { registration?: RegistrationRecord } = $props();
/* endregion variables */
</script>

<div class="col-span-3">
  <h2 class="label">{m.registration()}</h2>
</div>

<div class="col-span-9 flex flex-col items-start justify-between space-y-2">
  {#if registration?.registrationType}
    <div class="flex flex-row items-center justify-start space-x-4">
      {#if registration.registrationType === "fixedPrice"}
        <span>{m.registration_fixedPrice()}</span>
      {:else if registration.registrationType === "free"}
        <span>{m.registration_free()}</span>
      {:else if registration.registrationType === "slidingScale"}
        <span>{m.registration_slidingScale()}</span>
      {:else if registration.registrationType === "suggestedDonation"}
        <span>{m.registration_suggestedDonation()}</span>
      {:else if registration.registrationType === "other"}
        <span>{registration.otherText}</span>
      {:else}
        {m.unspecified()}
      {/if}
    </div>
  {/if}

  <div class="flex flex-row items-center justify-start space-x-4">
    {#if registration?.email}
      <Button
        class="flex flex-row items-center justify-start space-x-1 text-nowrap hover:text-muted-foreground"
        href="mailto:{registration.email}"
        variant="outline"
      >
        <span><EmailIcon size="16" /></span>
        <span>{m.email()}</span>
      </Button>
    {/if}
    {#if registration?.url}
      <Button
        class="flex flex-row items-center justify-start space-x-1 text-nowrap hover:text-muted-foreground"
        href={registration.url}
        target="_blank"
        variant="outline"
      >
        <span><WebIcon size="16" /></span>
        <span>{m.website()}</span>
      </Button>
    {/if}
  </div>
</div>
