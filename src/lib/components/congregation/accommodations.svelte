<script lang="ts">
	/* region imports */
	import AdaIcon from 'lucide-svelte/icons/accessibility';
	import CcIcon from 'lucide-svelte/icons/captions';
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import EvaIcon from 'lucide-svelte/icons/languages';

	import type { AccommodationsRecord } from '$lib/types';

	import AslIcon from '$lib/assets/asl.svg?component';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	import { state } from '$lib/stores';
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
	const asl = accommodations.inPerson_asl || accommodations.online_asl;
	const other = accommodations.otherText;
	/* endregion variables */
</script>

{#if mode === 'mini'}
	<div class="flex w-full flex-row items-center justify-end space-x-1 antialiased">
		{#if ada}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<AdaIcon size="20" />
					<span class="sr-only">{$t('congregation.accommodations.ada')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.accommodations.ada')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		{#if cc}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<CcIcon size="20" />
					<span class="sr-only">{$t('congregation.accommodations.cc')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.accommodations.cc')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		{#if eva}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<EvaIcon size="20" />
					<span class="sr-only">{$t('congregation.accommodations.eva')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.accommodations.eva')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		{#if asl}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<AslIcon class="h-5 w-5" />
					<span class="sr-only">{$t('congregation.accommodations.asl')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.accommodations.asl')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
	</div>
{/if}

{#if mode === 'full'}
	<div class="col-span-3">
		{#if $state.isMobile}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<h2 class="label">{$t('congregation.accommodations.short')}</h2>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.accommodations.accommodations')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{:else}
			<h2 class="label">{$t('congregation.accommodations.accommodations')}</h2>
		{/if}
	</div>
	<ul class="col-span-9 space-y-2">
		{#if ada}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<AdaIcon size="18" />
					<span class="sr-only">{$t('congregation.accommodations.ada')}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{#if accommodations.inPerson_adaSome}
						{$t('congregation.accommodations.inPerson_adaSome')}
					{/if}
					{#if accommodations.inPerson_adaAll}
						{$t('congregation.accommodations.inPerson_adaAll')}
					{/if}
				</span>
			</li>
		{/if}

		{#if cc}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<CcIcon size="18" />
					<span class="sr-only">{$t('congregation.accommodations.cc')}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{#if accommodations.hybrid_automatedCaptions}
						{$t('congregation.accommodations.hybrid_automatedCaptions')}
					{/if}
					{#if accommodations.hybrid_liveCaptions}
						{$t('congregation.accommodations.hybrid_liveCaptions')}
					{/if}
					{#if accommodations.online_automatedCaptions}
						{$t('congregation.accommodations.online_automatedCaptions')}
					{/if}
					{#if accommodations.online_liveCaptions}
						{$t('congregation.accommodations.online_liveCaptions')}
					{/if}
				</span>
			</li>
		{/if}

		{#if eva}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<EvaIcon size="18" />
					<span class="sr-only">{$t('congregation.accommodations.eva')}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{#if accommodations.inPerson_eva}
						{$t('congregation.accommodations.inPerson_eva')}
					{/if}
				</span>
			</li>
		{/if}

		{#if other}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">{other}</span>
			</li>
		{/if}

		{#if !ada && !cc && !eva && !other}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<WarningIcon size="18" />
					<span class="sr-only">{$t('common.unspecified')}</span>
				</span>

				<span class="flex flex-col items-start justify-start">{$t('common.unspecified')}</span>
			</li>
		{/if}
	</ul>
{/if}
