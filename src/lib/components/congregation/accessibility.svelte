<script lang="ts">
	/* region imports */
	import AdaIcon from 'lucide-svelte/icons/accessibility';
	import CcIcon from 'lucide-svelte/icons/captions';
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import EvaIcon from 'lucide-svelte/icons/languages';

	import type { AccessibilityRecord } from '$lib/types';

	import AslIcon from '$lib/assets/asl.svg?component';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let accessibility: AccessibilityRecord;
	export let mode: 'mini' | 'full' = 'mini';

	// constants
	const ada = accessibility.inPerson_adaSome || accessibility.inPerson_adaAll;
	const cc = accessibility.online_automatedCaptions || accessibility.online_liveCaptions;
	const eva = accessibility.inPerson_eva;
	const asl = accessibility.inPerson_asl || accessibility.online_asl;
	const other = accessibility.otherText;
	/* endregion variables */
</script>

{#if mode === 'mini'}
	<div class="flex w-full flex-row items-center justify-end space-x-1 antialiased">
		{#if ada}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<AdaIcon size="18" />
					<span class="sr-only">{$t('congregation.accessibility.ada')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.accessibility.ada')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		{#if cc}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<CcIcon size="18" />
					<span class="sr-only">{$t('congregation.accessibility.cc')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.accessibility.cc')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		{#if eva}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<EvaIcon size="18" />
					<span class="sr-only">{$t('congregation.accessibility.eva')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.accessibility.eva')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		{#if asl}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<AslIcon class="h-4 w-4" />
					<span class="sr-only">{$t('congregation.accessibility.asl')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.accessibility.asl')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
	</div>
{/if}

{#if mode === 'full'}
	<div class="col-span-3">
		<h2 class="label">{$t('congregation.accessibility.accessibility')}</h2>
	</div>
	<ul class="col-span-9 space-y-2">
		{#if ada}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<AdaIcon size="18" />
					<span class="sr-only">{$t('congregation.accessibility.ada')}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{#if accessibility.inPerson_adaSome}
						{$t('congregation.accessibility.inPerson_adaSome')}
					{/if}
					{#if accessibility.inPerson_adaAll}
						{$t('congregation.accessibility.inPerson_adaAll')}
					{/if}
				</span>
			</li>
		{/if}

		{#if cc}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<CcIcon size="18" />
					<span class="sr-only">{$t('congregation.accessibility.cc')}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{#if accessibility.online_automatedCaptions}
						{$t('congregation.accessibility.online_automatedCaptions')}
					{/if}
					{#if accessibility.online_liveCaptions}
						{$t('congregation.accessibility.online_liveCaptions')}
					{/if}
				</span>
			</li>
		{/if}

		{#if asl}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<AslIcon class="h-4 w-4" />
					<span class="sr-only">{$t('congregation.accessibility.asl')}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{#if accessibility.inPerson_asl}
						{$t('congregation.accessibility.inPerson_asl')}
					{/if}
					{#if accessibility.online_asl}
						{$t('congregation.accessibility.online_asl')}
					{/if}
				</span>
			</li>
		{/if}

		{#if eva}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<EvaIcon size="18" />
					<span class="sr-only">{$t('congregation.accessibility.eva')}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{#if accessibility.inPerson_eva}
						{$t('congregation.accessibility.inPerson_eva')}
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
