<script lang="ts">
	/* region imports */
	import type { ServicesRecord } from '$lib/pocketbase.d';

	import * as m from '$lib/paraglide/messages';
	/* endregion imports */

	/* region variables */
	// props
	const { services }: { services?: ServicesRecord } = $props();
	/* endregion variables */
</script>

<div class="col-span-3"><h2 class="label">{m.services.services}</h2></div>
<div class="col-span-9">
	<ul class="w-full space-y-2">
		{#if services?.inPerson}
			<li>{m.services.inPerson}</li>
		{/if}
		{#if services?.onlineOnly}
			<li>{m.services.onlineOnly}</li>
		{/if}
		{#if services?.hybrid}
			<li>{m.services.hybrid}</li>
		{/if}
		{#if services?.offsite}
			<li>{m.services.offsite}</li>
		{/if}
		{#if services?.other}
			<li>{services.otherText}</li>
		{/if}
	</ul>
</div>
