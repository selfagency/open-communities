<script lang="ts">
	import WarningIcon from 'lucide-svelte/icons/circle-alert';

	/* region imports */
	import type { SafetyRecord } from '$lib/types';

	import MaskIcon from '$lib/assets/mask.svg?component';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let safety: SafetyRecord | undefined;
	export let mode: 'mini' | 'full' = 'full';
	/* endregion variables */
</script>

{#if mode === 'mini'}
	{#if safety?.protocol === 'maskingRecommended' || safety?.protocol === 'maskingRequired'}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<span><MaskIcon class="w-18 h-3" /></span>
				<span class="sr-only">{$t(`congregation.safety.${safety.protocol}`)}</span>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<span class="text-nowrap">{$t(`congregation.safety.${safety.protocol}`)}</span>
			</Tooltip.Content>
		</Tooltip.Root>
	{/if}
{:else}
	<div class="col-span-3">
		<h2 class="label">{$t('congregation.safety.safety')}</h2>
	</div>

	<ul class="col-span-9 space-y-2">
		{#if safety?.protocol === 'maskingRecommended'}
			<li class="flex flex-row items-center justify-start space-x-1">
				<span><MaskIcon class="w-18 h-3" /></span>
				<span>{$t('congregation.safety.maskingRecommended')}</span>
			</li>
		{/if}

		{#if safety?.protocol === 'maskingRequired'}
			<li class="flex flex-row items-center justify-start space-x-1">
				<span><MaskIcon class="w-18 h-3" /></span>
				<span>{$t('congregation.safety.maskingRequired')}</span>
			</li>
		{/if}

		{#if safety?.protocol === 'noGuidelines'}
			<li class="flex flex-row items-center justify-start space-x-1">
				<span><WarningIcon size="18" /></span>
				<span>{$t('congregation.safety.noGuidelines')}</span>
			</li>
		{/if}

		{#if safety?.protocol === 'other'}
			<li class="flex flex-row items-center justify-start space-x-1">
				<span>{safety.otherText}</span>
			</li>
		{/if}
	</ul>
{/if}
