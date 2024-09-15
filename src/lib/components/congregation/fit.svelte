<script lang="ts">
	/* region imports */
	import WarningIcon from 'lucide-svelte/icons/circle-alert';

	import type { FitRecord } from '$lib/types';

	import { Separator } from '$lib/components/ui/separator';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let fit: FitRecord;
	/* endregion variables */
</script>

<div class="col-span-3">
	<h2 class="label">{$t('congregation.fit.fit')}</h2>
</div>
<div class="col-span-9">
	<ul class="space-y-2y w-full">
		{#if fit.publicStatement}
			<li>{$t('congregation.fit.publicStatement')}</li>
		{/if}

		{#if fit.clergyMember}
			<li>{$t('congregation.fit.clergyMember')}</li>
		{/if}

		{#if fit.multipleClergyMembers}
			<li>{$t('congregation.fit.multipleClergyMembers')}</li>
		{/if}
	</ul>
</div>

<Separator class="col-span-12" />

<div class="col-span-3">
	<h2 class="label">{$t('congregation.fit.flag.short')}</h2>
</div>
<div class="col-span-9">
	{#if fit.flag}
		{$t(`congregation.fit.flag.${fit.flag}`)}
	{:else}
		<div class="flex flex-row items-center justify-start space-x-1">
			<span> <WarningIcon size="18" /></span>
			<span>{$t('common.unspecified')}</span>
		</div>
	{/if}
</div>
