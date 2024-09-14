<script lang="ts">
	/* region imports */
	import EmailIcon from 'lucide-svelte/icons/mail';

	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let contactName: string | undefined;
	export let contactEmail: string | undefined;
	/* endregion variables */
</script>

<div class="col-span-3 flex flex-row items-center justify-start">
	<h2 class="label">{$t('congregation.contact')}</h2>
</div>
<div class="col-span-9 flex flex-row items-center justify-start">
	{#if contactEmail}
		<a
			href="mailto:{contactEmail}"
			class="flex flex-row items-center justify-center space-x-1 hover:text-slate-500"
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
