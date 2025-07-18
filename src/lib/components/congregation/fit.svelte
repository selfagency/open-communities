<script lang="ts">
	/* region imports */
	import type { FitRecord } from '$lib/pocketbase.d';

	import * as m from '$lib/paraglide/messages';
	/* endregion imports */

	/* region variables */
	// props
	const { fit }: { fit: FitRecord } = $props();
	/* endregion variables */
</script>

<div class="col-span-3">
	<h2 class="label">{m['fit.fit']()}</h2>
</div>
<div class="col-span-9">
	<ul class="w-full space-y-2">
		{#if fit.publicStatement}
			<li>{m['fit.publicStatement']()}</li>
		{/if}

		{#if fit.clergyMember}
			<li>{m['fit.clergyMember']()}</li>
		{/if}

		{#if fit.multipleClergyMembers}
			<li>{m['fit.multipleClergyMembers']()}</li>
		{/if}

		{#if fit.other}
			<li>{fit.otherText}</li>
		{/if}
	</ul>
</div>
