<script lang="ts">
	/* region imports */
	import SecurityIcon from 'lucide-svelte/icons/shield';
	import UnarmedIcon from 'lucide-svelte/icons/shield-ban';

	import type { SecurityRecord } from '$lib/types';

	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let security: SecurityRecord;
	export let mode: 'mini' | 'full' = 'mini';

	// constants
	/* endregion variables */
</script>

{#if mode === 'mini'}
	<div class="flex w-full flex-row items-center justify-end space-x-1 antialiased">
		{#if security.localPolice || security.privateSecurityArmed || security.clergyArmed || security.congregantsArmed}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<SecurityIcon size="18" />
					<span class="sr-only">{$t('congregation.security.armedSecurity')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.security.armedSecurity')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{:else if security.privateSecurityUnarmed}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<UnarmedIcon size="18" />
					<span class="sr-only">{$t('congregation.security.unarmedSecurity')}</span>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<span class="text-nowrap">{$t('congregation.security.unarmedSecurity')}</span>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
	</div>
{/if}

{#if mode === 'full'}
	<div class="col-span-3">
		<h2 class="label">{$t('congregation.security.security')}</h2>
	</div>
	<ul class="col-span-9 space-y-2">
		{#if security.localPolice || security.privateSecurityArmed || security.clergyArmed || security.congregantsArmed}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<SecurityIcon size="18" />
					<span class="sr-only">{$t('congregation.security.armedSecurity')}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{#if security.localPolice}
						{$t('congregation.security.localPolice')}
					{/if}
					{#if security.privateSecurityArmed}
						{$t('congregation.security.privateSecurityArmed')}
					{/if}
					{#if security.clergyArmed}
						{$t('congregation.security.clergyArmed')}
					{/if}
					{#if security.congregantsArmed}
						{$t('congregation.security.congregantsArmed')}
					{/if}
				</span>
			</li>
		{/if}
		{#if security.privateSecurityUnarmed}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<UnarmedIcon size="18" />
					<span class="sr-only">{$t('congregation.security.unarmedSecurity')}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{$t('congregation.security.privateSecurityUnarmed')}
				</span>
			</li>
		{/if}
		{#if security.privateSecurityUnarmed}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					{$t('congregation.security.noFirearms')}
				</span>
			</li>
		{/if}
	</ul>
{/if}
