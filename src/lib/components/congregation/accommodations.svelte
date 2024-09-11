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
	<div class="flex w-full flex-row items-center justify-end space-x-1">
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
	<div class="col-span-3">
		<Tooltip.Root>
			<Tooltip.Trigger>
				<h2 class="label">{$t('base.accommodations.short')}</h2>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<span class="text-nowrap">{$t('base.accommodations.accommodations')}</span>
			</Tooltip.Content>
		</Tooltip.Root>
	</div>
	<div class="col-span-9">
		{#if ada}
			<div class="flex flex-row items-center justify-start space-x-1">
				<span>
					<AdaIcon size="18" />
					<span class="sr-only">{$t('base.accommodations.ada')}</span>
				</span>
				<span>
					{#if accommodations.inPerson_adaSome}
						{$t('base.accommodations.inPerson_adaSome')}
					{/if}
					{#if accommodations.inPerson_adaAll}
						{$t('base.accommodations.inPerson_adaAll')}
					{/if}
				</span>
			</div>
		{/if}

		{#if cc}
			<div class="flex flex-row items-center justify-start space-x-1">
				<span>
					<CcIcon size="18" />
					<span class="sr-only">{$t('base.accommodations.cc')}</span>
				</span>
				<span>
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
				</span>
			</div>
		{/if}

		{#if eva}
			<div class="flex flex-row items-center justify-start space-x-1">
				<span>
					<EvaIcon size="18" />
					<span class="sr-only">{$t('base.accommodations.eva')}</span>
				</span>
				<span>
					{#if accommodations.inPerson_eva}
						{$t('base.accommodations.inPerson_eva')}
					{/if}
				</span>
			</div>
		{/if}

		{#if !ada && !cc && !eva}
			<div class="flex flex-row items-center justify-start space-x-1">
				<span>
					<WarningIcon size="18" />
					<span class="sr-only">{$t('base.common.unspecified')}</span>
				</span>

				<span>{$t('base.common.unspecified')}</span>
			</div>
		{/if}
	</div>
{/if}
