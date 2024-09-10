<script lang="ts">
	/* region imports */
	import LinkIcon from 'lucide-svelte/icons/square-arrow-out-up-right';

	import type {
		CongregationMetaRecord,
		AccommodationsRecord,
		FitRecord,
		ServicesRecord,
		RegistrationRecord,
		SafetyRecord
	} from '$lib/types';

	import * as Dialog from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n';

	import Accommodations from './accommodations.svelte';
	import Contact from './contact.svelte';
	import Fit from './fit.svelte';
	import Registration from './registration.svelte';
	import Safety from './safety.svelte';
	import Services from './services.svelte';
	import Tile from './tile.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregation: CongregationMetaRecord;

	// constants
	const accommodations = congregation.accommodations as AccommodationsRecord;
	const fit = congregation.fit as FitRecord;
	const services = congregation.services as ServicesRecord;
	const registration = congregation.registration as RegistrationRecord;
	const safety = congregation.safety as SafetyRecord;
	/* endregion variables */
</script>

<!-- {
      X"id": "RECORD_ID",
      X"collectionId": "o7pypf0j70kmhet",
      X"collectionName": "congregationMeta",
      X"name": "test",
      X"city": "test",
      X"state": "test",
      X"country": "test",
      X"description": "test",
      X"notes": "test",
      X"clergy": "test",
      X"flavor": "test",
      X"contactName": "test",
      X"contactEmail": "test@example.com",
      X"contactUrl": "https://example.com",
      X"accommodations": "JSON",
      X"fit": "JSON",
      "registration": "JSON",
      "safety": "JSON",
      X"services": "JSON"
    }, -->

<Dialog.Root>
	<Dialog.Trigger>
		<Tile {congregation} />
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{#if congregation.contactUrl}
					<div class="flex flex-row items-center justify-start space-x-2">
						<a href={congregation.contactUrl} target="_blank" rel="noopener noreferrer">
							{congregation.name}
						</a>
						<LinkIcon size="14" color="gray" />
					</div>
				{:else}
					{congregation.name}
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				<span>{congregation.city}</span>,
				<span>{congregation.state}</span>{#if congregation.country !== 'US'}<span
						>, {congregation.country}</span
					>{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if congregation.description}
			<p>{congregation.description}</p>
		{/if}

		<div class="grid grid-cols-12 gap-x-2 gap-y-4">
			{#if congregation.flavor}
				<div class="col-span-3 flex flex-row items-start justify-start">
					<h2 class="label">{$t('base.congregation.flavor')}</h2>
				</div>
				<div class="col-span-9 flex flex-row items-start justify-start">
					{congregation.flavor}
				</div>
			{/if}

			{#if congregation.clergy}
				<div class="col-span-3 flex flex-row items-start justify-start">
					<h2 class="label">{$t('base.congregation.clergy')}</h2>
				</div>
				<div class="col-span-9 flex flex-row items-start justify-start">
					{congregation.clergy}
				</div>
			{/if}

			{#if fit}
				<Fit {fit} />
			{/if}

			{#if services}
				<Services {services} />
			{/if}

			{#if accommodations}
				<Accommodations {accommodations} mode="full" />
			{/if}

			{#if safety}
				<Safety {safety} />
			{/if}

			{#if registration}
				<Registration {registration} />
			{/if}

			{#if congregation.contactName || congregation.contactEmail}
				<Contact contactName={congregation.contactName} contactEmail={congregation.contactEmail} />
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
