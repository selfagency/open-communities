<script lang="ts">
	/* region imports */
	import AdaIcon from 'lucide-svelte/icons/accessibility';
	import CcIcon from 'lucide-svelte/icons/captions';
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import EvaIcon from 'lucide-svelte/icons/languages';

	import type { AccommodationsRecord } from '$lib/types';

	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let accommodations: AccommodationsRecord;
	export let mode: 'mini' | 'full' = 'mini';

	// constants
	const ada = accommodations.inPerson_adaSome || accommodations.inPerson_adaAll;
	const cc =
		accommodations.hybrid_automatedCaptions ||
		accommodations.hybrid_liveCaptions ||
		accommodations.online_automatedCaptions ||
		accommodations.online_liveCaptions;
	const eva = accommodations.inPerson_eva;
	/* endregion variables */
</script>

{#if mode === 'mini'}
	<div class="flex w-full flex-row items-center justify-end space-x-2">
		{#if ada}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<AdaIcon size="18" />
					<span class="sr-only">{$t('base.accommodations.ada')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('base.accommodations.ada')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		{#if cc}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<CcIcon size="18" />
					<span class="sr-only">{$t('base.accommodations.cc')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('base.accommodations.cc')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		{#if eva}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<EvaIcon size="18" />
					<span class="sr-only">{$t('base.accommodations.eva')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('base.accommodations.eva')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
	</div>
{/if}

{#if mode === 'full'}
	<h2 class="text-md font-bold">{$t('base.accommodations')}</h2>

	<div class="grid grid-cols-12 gap-x-0 gap-y-4">
		{#if ada}
			<div class="col-span-1 flex flex-row items-center justify-start">
				<AdaIcon size="18" />
				<span class="sr-only">{$t('base.accommodations.ada')}</span>
			</div>
			<div class="col-span-11 flex flex-col items-start justify-center text-sm">
				{#if accommodations.inPerson_adaSome}
					{$t('base.accommodations.inPerson_adaSome')}
				{/if}
				{#if accommodations.inPerson_adaAll}
					{$t('base.accommodations.inPerson_adaAll')}
				{/if}
			</div>
		{/if}

		{#if cc}
			<div class="col-span-1 flex flex-row items-start justify-start">
				<CcIcon size="18" />
				<span class="sr-only">{$t('base.accommodations.cc')}</span>
			</div>
			<div class="col-span-11 flex flex-col items-start justify-center text-sm">
				{#if accommodations.hybrid_automatedCaptions}
					{$t('base.accommodations.hybrid_automatedCaptions')}
				{/if}
				{#if accommodations.hybrid_liveCaptions}
					{$t('base.accommodations.hybrid_liveCaptions')}
				{/if}
				{#if accommodations.online_automatedCaptions}
					{$t('base.accommodations.online_automatedCaptions')}
				{/if}
				{#if accommodations.online_liveCaptions}
					{$t('base.accommodations.online_liveCaptions')}
				{/if}
			</div>
		{/if}

		{#if eva}
			<div class="col-span-1 flex flex-row items-start justify-start">
				<EvaIcon size="18" />
				<span class="sr-only">{$t('base.accommodations.eva')}</span>
			</div>
			<div class="col-span-11 flex flex-col items-start justify-center text-sm">
				{#if accommodations.inPerson_eva}
					{$t('base.accommodations.inPerson_eva')}
				{/if}
			</div>
		{/if}

		{#if !ada && !cc && !eva}
			<div class="col-span-1 flex flex-row items-start justify-start">
				<WarningIcon size="18" />
				<span class="sr-only">{$t('base.unspecified')}</span>
			</div>
			<div class="justify-left col-span-11 flex flex-row items-center text-sm">
				{$t('base.unspecified')}
			</div>
		{/if}
	</div>
{/if}
