<script lang="ts">
import { m } from '$lib/paraglide/messages';
/* region imports */
import type { ServicesRecord } from '$lib/pocketbase.d';

/* endregion imports */

/* region variables */
// props
const { services }: { services?: ServicesRecord } = $props();
/* endregion variables */
</script>

<div class="col-span-3"><h2 class="label">{m.services()}</h2></div>
<div class="col-span-9">
  <ul class="w-full space-y-2">
    {#if services?.inPerson}
      <li>{m.services_inPerson()}</li>
    {/if}
    {#if services?.onlineOnly}
      <li>{m.services_onlineOnly()}</li>
    {/if}
    {#if services?.hybrid}
      <li>{m.services_hybrid()}</li>
    {/if}
    {#if services?.offsite}
      <li>{m.services_offsite()}</li>
    {/if}
    {#if services?.other}
      <li>{services.otherText}</li>
    {/if}
  </ul>
</div>
