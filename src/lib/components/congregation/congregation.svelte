<script lang="ts">
	/* region imports */
	import LinkIcon from 'lucide-svelte/icons/square-arrow-out-up-right';

	import type {
		CongregationMetaRecord,
		AccessibilityRecord,
		FitRecord,
		ServicesRecord,
		RegistrationRecord,
		HealthRecord,
		SecurityRecord,
		CitiesRecord as City,
		StatesRecord as State,
		CountriesRecord as Country
	} from '$lib/types';

	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores';

	import Accessibility from './accessibility.svelte';
	import Contact from './contact.svelte';
	import Fit from './fit.svelte';
	import Health from './health.svelte';
	import Registration from './registration.svelte';
	import Security from './security.svelte';
	import Services from './services.svelte';
	import Tile from './tile.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregation: CongregationMetaRecord & { id: string };

	// constants
	const accessibility = congregation.accessibility as AccessibilityRecord;
	const fit = congregation.fit as FitRecord;
	const { city, state, country } = congregation.location as {
		city: City;
		state: State;
		country: Country;
	};
	const notes = congregation.notes as string;
	const services = congregation.services as ServicesRecord;
	const registration = congregation.registration as RegistrationRecord;
	const health = congregation.health as HealthRecord;
	const security = congregation.security as SecurityRecord;

	// local vars
	let tab: 'about' | 'services' | 'accessibility & health';
	/* endregion variables */

	/* region methods */
	const allFalse = (obj) => Object.values(obj).every((v) => !v && v !== '');
	/* endregion methods */
</script>

<Dialog.Root>
	<Dialog.Trigger class="h-full min-h-max w-full">
		<Tile {congregation} />
	</Dialog.Trigger>
	<Dialog.Content
		class="max-h-[90vh] min-w-[380px] max-w-[380px] overflow-y-scroll sm:max-w-[540px]"
	>
		<Dialog.Header>
			<Dialog.Title>
				{#if congregation.contactUrl}
					<a href={congregation.contactUrl} target="_blank" rel="noopener noreferrer">
						<h1 class="inline text-2xl leading-6">
							<span>{congregation.name}</span>
						</h1>
						<span><LinkIcon size="14" color="gray" class="ml-1 inline" /></span>
					</a>
				{:else}
					<h1 class="inline text-2xl leading-6">
						{congregation.name}
					</h1>
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if city.name || state.name || country.name}
					{#if city.name}<span>{city.name}</span>{#if state.name || country.name},{/if}{/if}
					{#if state.name}<span>{state.name}</span
						>{#if country.name && country.name !== 'United States'},{/if}{/if}
					{#if country.name && country.name !== 'United States'}<span>{country.name}</span>{/if}
				{:else if services.onlineOnly}
					{$t('congregation.services.onlineOnly')}
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if congregation.flavor}
			<p>{congregation.flavor}</p>
		{/if}

		<!-- <Tabs.Root bind:value={tab}>
			<Tabs.List class="w-full">
				<Tabs.Trigger value="login" class="w-1/2">{$t('auth.login')}</Tabs.Trigger>
				<Tabs.Trigger value="signup" class="w-1/2">{$t('auth.signUp')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="login"></Tabs.Content>
			<Tabs.Content value="signup"></Tabs.Content>
		</Tabs.Root> -->

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

			{#if !allFalse(fit)}
				<Fit {fit} />
				<Separator class="col-span-12" />
			{/if}

			{#if !allFalse(services)}
				<Services {services} />
				<Separator class="col-span-12" />
			{/if}

			{#if !allFalse(accessibility)}
				<Accessibility {accessibility} mode="full" />
				<Separator class="col-span-12" />
			{/if}

			{#if !allFalse(health)}
				<Health {health} />
				<Separator class="col-span-12" />
			{/if}

			{#if !allFalse(security)}
				<Security {security} />
				<Separator class="col-span-12" />
			{/if}

			{#if !allFalse(notes)}
				<div class="col-span-3 flex flex-row items-start justify-start">
					<h2 class="label">{$t('congregation.notes.notes')}</h2>
				</div>
				<div class="col-span-9 flex flex-row items-start justify-start">
					<p>{notes}</p>
				</div>
				<Separator class="col-span-12" />
			{/if}

			{#if !allFalse(registration)}
				<Registration {registration} />
			{/if}

			{#if $user.admin && (congregation.contactName || congregation.contactEmail)}
				<Separator class="col-span-12" />
				<Contact contactName={congregation.contactName} contactEmail={congregation.contactEmail} />
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
