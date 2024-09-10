<script lang="ts">
	/* region imports */
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let contactName: string | undefined;
	export let contactEmail: string | undefined;
	/* endregion variables */
</script>

<div class="col-span-3 flex flex-row items-start justify-start">
	<h2 class="label">{$t('base.congregation.contact')}</h2>
</div>
<div class="col-span-9 flex flex-row items-start justify-start">
	{#if contactEmail && contactName}
		<a href="mailto:{contactEmail}" class="underline">
			{#if contactName}
				{contactName}
			{:else}
				{contactEmail}
			{/if}
		</a>
	{:else}
		{contactName}
	{/if}
</div>
