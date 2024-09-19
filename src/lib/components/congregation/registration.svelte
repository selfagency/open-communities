<script lang="ts">
	/* region imports */
	import WebIcon from 'lucide-svelte/icons/globe';
	import EmailIcon from 'lucide-svelte/icons/mail';

	import type { RegistrationRecord } from '$lib/types';

	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let registration: RegistrationRecord | undefined;
	/* endregion variables */
</script>

<div class="col-span-3">
	<h2 class="label">{$t('congregation.registration.registration')}</h2>
</div>

<div class="col-span-9 flex flex-row items-start justify-between space-x-2">
	{#if registration?.registrationType}
		<div class="flex flex-row items-center justify-start space-x-4">
			{#if registration.registrationType === 'fixedPrice'}
				<span>{$t('congregation.registration.fixedPrice')}</span>
			{:else if registration.registrationType === 'free'}
				<span>{$t('congregation.registration.free')}</span>
			{:else if registration.registrationType === 'slidingScale'}
				<span>{$t('congregation.registration.slidingScale')}</span>
			{:else if registration.registrationType === 'suggestedDonation'}
				<span>{$t('congregation.registration.suggestedDonation')}</span>
			{:else if registration.registrationType === 'other'}
				<span>{registration.otherText}</span>
			{:else}
				{$t('common.unspecified')}
			{/if}
		</div>
	{/if}

	<div class="flex flex-col items-start justify-start space-y-4">
		{#if registration?.email}
			<Button
				variant="outline"
				href="mailto:{registration.email}"
				class="flex flex-row items-center justify-start space-x-1 text-nowrap hover:text-slate-500"
			>
				<span><EmailIcon size="16" /></span>
				<span>{$t('common.email')}</span>
			</Button>
		{/if}
		{#if registration?.url}
			<Button
				variant="outline"
				href={registration.url}
				target="_blank"
				class="flex flex-row items-center justify-start space-x-1 text-nowrap hover:text-slate-500"
			>
				<span><WebIcon size="16" /></span>
				<span>{$t('common.website')}</span>
			</Button>
		{/if}
	</div>
</div>
