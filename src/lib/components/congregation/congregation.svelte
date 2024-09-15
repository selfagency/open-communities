<script lang="ts">
	/* region imports */
	import LinkIcon from 'lucide-svelte/icons/square-arrow-out-up-right';

	import type {
		CongregationMetaRecord,
		AccommodationsRecord,
		FitRecord,
		ServicesRecord,
		RegistrationRecord,
		SafetyRecord,
		CitiesRecord as City,
		StatesRecord as State,
		CountriesRecord as Country
	} from '$lib/types';

	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
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
	export let congregation: CongregationMetaRecord & { id: string };

	// constants
	const accommodations = congregation.accommodations as AccommodationsRecord;
	const fit = congregation.fit as FitRecord;
	const { city, state, country } = congregation.location as {
		city: City;
		state: State;
		country: Country;
	};
	const services = congregation.services as ServicesRecord;
	const registration = congregation.registration as RegistrationRecord;
	const safety = congregation.safety as SafetyRecord;
	/* endregion variables */
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Tile {congregation} />
	</Dialog.Trigger>
	<Dialog.Content class="min-w-[380px] max-w-[380px] sm:max-w-[540px]">
		<Dialog.Header>
			<Dialog.Title>
				{#if congregation.contactUrl}
					<a
						href={congregation.contactUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="flex max-w-fit flex-row items-center justify-start space-x-2"
					>
						<h1 class="font-display text-2xl leading-5">{congregation.name}</h1>
						<LinkIcon size="14" color="gray" />
					</a>
				{:else}
					{congregation.name}
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if city.name}<span>{city.name}</span>,{/if}
				{#if state.name}<span>{state.name}</span>,{/if}
				{#if country.name !== 'United States'}<span>{country.name}</span>{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if congregation.flavor}
			<p>{congregation.flavor}</p>
		{/if}

		<div class="grid grid-cols-12 gap-x-0 gap-y-4 text-sm">
			{#if congregation.clergy}
				<div class="col-span-3 flex flex-row items-start justify-start">
					<h2 class="label">{$t('congregation.clergy.clergy')}</h2>
				</div>
				<div class="col-span-9 flex flex-row items-start justify-start">
					{congregation.clergy}
				</div>
				<Separator class="col-span-12" />
			{/if}

			{#if fit}
				<Fit {fit} />
				<Separator class="col-span-12" />
			{/if}

			{#if services}
				<Services {services} />
				<Separator class="col-span-12" />
			{/if}

			{#if accommodations}
				<Accommodations {accommodations} mode="full" />
				<Separator class="col-span-12" />
			{/if}

			{#if safety}
				<Safety {safety} />
				<Separator class="col-span-12" />
			{/if}

			{#if registration}
				<Registration {registration} />
			{/if}

			{#if congregation.contactName || congregation.contactEmail}
				<Separator class="col-span-12" />
				<Contact contactName={congregation.contactName} contactEmail={congregation.contactEmail} />
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
