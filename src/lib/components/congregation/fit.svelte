<script lang="ts">
import { m } from '$lib/paraglide/messages';
/* region imports */
import type { FitRecord } from '$lib/pocketbase.d';

/* endregion imports */

/* region variables */
// props
const { fit }: { fit: FitRecord } = $props();
/* endregion variables */
</script>

<div class="col-span-3">
  <h2 class="label">{m.fit()}</h2>
</div>
<div class="col-span-9">
  <ul class="w-full space-y-2">
    {#if fit.publicStatement}
      <li>{m.fit_publicStatement()}</li>
    {/if}

    {#if fit.clergyMember}
      <li>{m.fit_clergyMember()}</li>
    {/if}

    {#if fit.multipleClergyMembers}
      <li>{m.fit_multipleClergyMembers()}</li>
    {/if}

    {#if fit.other}
      <li>{fit.otherText}</li>
    {/if}
  </ul>
</div>
