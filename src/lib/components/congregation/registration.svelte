<script lang="ts">
	import WebIcon from 'lucide-svelte/icons/globe';
	import EmailIcon from 'lucide-svelte/icons/mail';

	/* region imports */
	import type { RegistrationRecord } from '$lib/types';

	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let registration: RegistrationRecord | undefined;
	/* endregion variables */
</script>

<div class="col-span-3">
	<h2 class="label">{$t('registration.registration')}</h2>
</div>

<div class="col-span-9 flex flex-col items-start justify-start space-y-2">
	{#if registration?.registrationType}
		<div class="flex flex-row items-center justify-start space-x-4">
			{#if registration.registrationType === 'fixedPrice'}
				<span>{$t('registration.fixedPrice')}</span>
			{:else if registration.registrationType === 'slidingScale'}
				<span>{$t('registration.slidingScale')}</span>
			{:else if registration.registrationType === 'suggestedDonation'}
				<span>{$t('registration.suggestedDonation')}</span>
			{:else if registration.registrationType === 'other'}
				<span>{registration.otherText}</span>
			{:else}
				{$t('common.unspecified')}
			{/if}
		</div>
	{/if}

	<div class="flex flex-row items-center justify-start space-x-4">
		{#if registration?.email}
			<a
				href="mailto:{registration.email}"
				class="flex flex-row items-center justify-start space-x-2 text-nowrap hover:text-slate-500"
			>
				<span><EmailIcon size="18" /></span>
				<span>{$t('common.email')}</span>
			</a>
		{/if}
		{#if registration?.url}
			<a
				href={registration.url}
				target="_blank"
				class="flex flex-row items-center justify-start space-x-2 text-nowrap hover:text-slate-500"
			>
				<span><WebIcon size="18" /></span>
				<span>{$t('common.website')}</span>
			</a>
		{/if}
	</div>
</div>
