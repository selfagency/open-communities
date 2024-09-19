<script lang="ts">
	import WarningIcon from 'lucide-svelte/icons/circle-alert';

	/* region imports */
	import type { HealthRecord } from '$lib/types';

	import MaskIcon from '$lib/assets/mask.svg?component';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let health: HealthRecord | undefined;
	export let mode: 'mini' | 'full' = 'full';
	/* endregion variables */
</script>

{#if mode === 'mini'}
	{#if health?.protocol === 'maskingRecommended' || health?.protocol === 'maskingRequired' || (health?.protocol === 'other' && health?.otherText !== 'N/A')}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<span><MaskIcon class="mt-1 h-5 w-5" /></span>
				<span class="sr-only">{$t(`congregation.health.${health.protocol}`)}</span>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<span class="text-nowrap">{$t(`congregation.health.${health.protocol}`)}</span>
			</Tooltip.Content>
		</Tooltip.Root>
	{/if}
{:else}
	<div class="col-span-3">
		<h2 class="label">{$t('congregation.health.health')}</h2>
	</div>

	<ul class="col-span-9 space-y-2">
		{#if health?.protocol === 'other' && health?.otherText === 'N/A'}
			{$t('congregation.health.notApplicable')}
		{:else}
			{#if health?.protocol === 'maskingRecommended'}
				<li class="flex flex-row items-center justify-start space-x-1">
					<span><MaskIcon class="mt-1 h-5 w-5" /></span>
					<span>{$t('congregation.health.maskingRecommended')}</span>
				</li>
			{/if}

			{#if health?.protocol === 'maskingRequired'}
				<li class="flex flex-row items-center justify-start space-x-1">
					<span><MaskIcon class="mt-1 h-5 w-5" /></span>
					<span>{$t('congregation.health.maskingRequired')}</span>
				</li>
			{/if}

			{#if health?.protocol === 'noGuidelines'}
				<li class="flex flex-row items-center justify-start space-x-1">
					<span><WarningIcon size="18" /></span>
					<span>{$t('congregation.health.noGuidelines')}</span>
				</li>
			{/if}

			{#if health?.protocol === 'other'}
				<li class="flex flex-row items-center justify-start space-x-1">
					<span>{health.otherText}</span>
				</li>
			{/if}
		{/if}
	</ul>
{/if}
