<script lang="ts">
  /* region imports */
  import WebIcon from "@lucide/svelte/icons/globe";
  import EmailIcon from "@lucide/svelte/icons/mail";
  import { Button } from "$lib/components/ui/button";
  import { m } from "$lib/paraglide/messages";
  import type { RegistrationRecord } from "$lib/pocketbase.d";

  /* endregion imports */

  /* region variables */
  // props
  const { registration }: { registration?: RegistrationRecord } = $props();
  /* endregion variables */
</script>

<div class="col-span-4">
  <h2 class="label">{m.registration()}</h2>
</div>

<div class="col-span-8 flex flex-col items-start justify-between space-y-2">
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
        variant="outline"
        href="mailto:{registration.email}"
        class="flex flex-row items-center justify-start space-x-1 text-nowrap hover:text-muted-foreground"
      >
        <span><EmailIcon size="16" /></span>
        <span>{m.email()}</span>
      </Button>
    {/if}
    {#if registration?.url}
      <Button
        variant="outline"
        href={registration.url}
        target="_blank"
        class="flex flex-row items-center justify-start space-x-1 text-nowrap hover:text-muted-foreground"
      >
        <span><WebIcon size="16" /></span>
        <span>{m.website()}</span>
      </Button>
    {/if}
  </div>
</div>
