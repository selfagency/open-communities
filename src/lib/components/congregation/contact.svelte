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

<div class="col-span-2 flex flex-row items-start justify-start">
	<span class="font-bold">{$t('base.congregation.contact')}</span>
</div>
<div class="col-span-10 flex flex-row items-start justify-start">
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
