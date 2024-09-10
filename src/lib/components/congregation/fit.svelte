<script lang="ts">
	/* region imports */
	import WarningIcon from 'lucide-svelte/icons/circle-alert';

	import type { FitRecord } from '$lib/types';

	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let fit: FitRecord;
	/* endregion variables */
</script>

<div class="col-span-3">
	<h2 class="label">{$t('base.fit')}</h2>
</div>
<div class="col-span-9">
	<ul class="w-full list-inside list-disc">
		{#if fit.publicStatement}
			<li>{$t('base.fit.publicStatement')}</li>
		{/if}

		{#if fit.clergyMember}
			<li>{$t('base.fit.clergyMember')}</li>
		{/if}

		{#if fit.multipleClergyMembers}
			<li>{$t('base.fit.multipleClergyMembers')}</li>
		{/if}
	</ul>
</div>

<div class="col-span-3">
	<Tooltip.Root>
		<Tooltip.Trigger>
			<h2 class="label">{$t('base.fit.flag.short')}</h2>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<h2 class="label">{$t('base.fit.flag')}</h2>
		</Tooltip.Content>
	</Tooltip.Root>
</div>
<div class="col-span-9">
	{#if fit.flag}
		{fit.flag}
	{:else}
		<div class="flex flex-row items-center justify-start space-x-1">
			<span> <WarningIcon size="18" /></span>
			<span>{$t('base.unspecified')}</span>
		</div>
	{/if}
</div>
