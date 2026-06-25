<script lang="ts">
/* region imports */
import EmailIcon from '@tabler/icons-svelte/icons/mail';

import { m } from '$lib/paraglide/messages';

/* endregion imports */

/* region variables */
// props
const {
  contactEmail,
  contactName
}: {
  contactEmail?: string;
  contactName?: string;
} = $props();
/* endregion variables */
</script>

<div class="col-span-3 flex flex-row items-center justify-start">
  <h2 class="label">{m.contact()}</h2>
</div>
<div class="col-span-9 flex flex-row items-center justify-start">
  {#if contactEmail}
    <a
      class="flex flex-row items-center justify-center space-x-1 hover:text-muted-foreground"
      href="mailto:{contactEmail}"
    >
      <span><EmailIcon size="18" /></span>
      <span>
        {#if contactName}
          {contactName}
        {:else}
          {contactEmail}
        {/if}
      </span>
    </a>
  {:else if contactName}
    {contactName}
  {/if}
</div>
