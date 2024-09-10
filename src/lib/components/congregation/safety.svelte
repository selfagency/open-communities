<script lang="ts">
	import WarningIcon from 'lucide-svelte/icons/circle-alert';

	/* region imports */
	import type { SafetyRecord } from '$lib/types';

	import MaskIcon from '$lib/assets/mask.svg?component';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let safety: SafetyRecord | undefined;
	/* endregion variables */
</script>

<div class="col-span-3">
	<h2 class="label">{$t('base.safety')}</h2>
</div>

<div class="col-span-9 space-y-2">
	{#if safety?.maskingRecommended}
		<div class="flex flex-row items-center justify-start space-x-1">
			<span><MaskIcon class="w-18" /></span>
			<span>{$t('base.safety.maskingRecommended')}</span>
		</div>
	{/if}

	{#if safety?.maskingRequired}
		<div class="flex flex-row items-center justify-start space-x-1">
			<span><MaskIcon class="w-18" /></span>
			<span>{$t('base.safety.maskingRequired')}</span>
		</div>
	{/if}

	{#if safety?.noGuidelines}
		<div class="flex flex-row items-center justify-start space-x-1">
			<span><WarningIcon size="18" /></span>
			<span>{$t('base.safety.noGuidelines')}</span>
		</div>
	{/if}

	{#if safety?.other}
		<div class="flex flex-row items-center justify-start space-x-1">
			<span class="italic">{safety.otherText}</span>
		</div>
	{/if}
</div>
