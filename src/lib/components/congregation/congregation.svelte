<script lang="ts">
	/* region imports */
	import ShareIcon from 'lucide-svelte/icons/share';
	import LinkIcon from 'lucide-svelte/icons/square-arrow-out-up-right';
	import { omit, isEmpty } from 'radashi';
	import { copyText } from 'svelte-copy';
	import { toast } from 'svelte-sonner';

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

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Tooltip from '$lib/components/ui/tooltip';
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
	export let open: boolean = false;

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
	let tab: 'about' | 'services' | 'details' = 'about';
	/* endregion variables */

	/* region methods */
	const allFalse = (obj) => Object.values(omit(obj, ['id', 'otherText'])).every((v) => !v);
	/* endregion methods */
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class="h-full min-h-max w-full">
		<Tile {congregation} />
	</Dialog.Trigger>
	<Dialog.Content
		data-id={congregation.id}
		class="flex max-h-[85vh] min-h-[35vh] min-w-[360px] max-w-[360px] flex-col items-start justify-start overflow-y-scroll p-6 sm:max-w-[540px] sm:p-8"
	>
		<Dialog.Header class="w-full">
			<Dialog.Title>
				{#if congregation.contactUrl}
					<a
						href={congregation.contactUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-block max-w-[92%] hyphens-auto"
					>
						<h1 class="inline-lbock text-2xl leading-7">
							<span>{congregation.name}</span>
							<span><LinkIcon size="14" color="gray" class="inline" /></span>
						</h1>
					</a>
				{:else}
					<h1 class="inline text-2xl leading-6">
						{congregation.name}
					</h1>
				{/if}
			</Dialog.Title>
			<Dialog.Description class="flex w-full flex-row items-center justify-between space-x-2">
				<span class="w-2/3">
					{#if city.name || state.name || country.name}
						{#if city.name}<span>{city.name}</span>{#if state.name || country.name},{/if}{/if}
						{#if state.name}<span>{state.name}</span
							>{#if country.name && country.name !== 'United States'},{/if}{/if}
						{#if country.name && country.name !== 'United States'}<span>{country.name}</span>{/if}
					{:else if services.onlineOnly}
						{$t('congregation.services.onlineOnly')}
					{/if}
				</span>

				<div class="flex w-1/3 flex-row items-center justify-end space-x-2">
					{#if isEmpty(congregation.owner)}
						<a href={`/contact?claim=${congregation.id}`}>
							<Badge
								variant="outline"
								class="text-nowrap font-normal text-slate-500 hover:bg-slate-100"
								>{$t('congregation.claimThis')}</Badge
							>
						</a>
					{/if}
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="ghost"
								class="h-8 px-2 py-0"
								on:click={() => {
									copyText(`https://opencommunities.info?id=${congregation.id}`);
									toast.success($t('common.copied'));
								}}
							>
								<ShareIcon size="16" class="text-slate-500" />
							</Button>
							<span class="sr-only">{$t('common.share')}</span>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<span class="text-nowrap">{$t('common.share')}</span>
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
			</Dialog.Description>
		</Dialog.Header>

		<Tabs.Root bind:value={tab} class="w-full">
			<Tabs.List class="my-4 w-full">
				<Tabs.Trigger value="about" class="w-1/2">{$t('congregation.about')}</Tabs.Trigger>
				<Tabs.Trigger value="services" class="w-1/2"
					>{$t('congregation.services.services')}</Tabs.Trigger
				>
				<Tabs.Trigger value="details" class="w-1/2">{$t('congregation.details')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="about">
				{#if congregation.flavor}
					<p class="mb-6">{congregation.flavor}</p>
				{/if}

				<div class="grid grid-cols-12 gap-4 text-sm">
					{#if congregation.denomination}
						<div class="col-span-3 flex flex-row items-start justify-start">
							<h2 class="label">{$t('congregation.denomination.affiliation')}</h2>
						</div>
						<div class="col-span-9 flex flex-row items-start justify-start">
							{$t(`congregation.denomination.options.${congregation.denomination}`)}
						</div>
					{/if}

					{#if !allFalse(fit)}
						{#if congregation.denomination || congregation.flavor}<Separator
								class="col-span-12"
							/>{/if}
						<Fit {fit} />
					{/if}

					{#if $user.admin && (congregation.contactName || congregation.contactEmail)}
						<Separator class="col-span-12" />
						<Contact
							contactName={congregation.contactName}
							contactEmail={congregation.contactEmail}
						/>
					{/if}
				</div>
			</Tabs.Content>
			<Tabs.Content value="services">
				<div class="grid grid-cols-12 gap-4 text-sm">
					{#if congregation.clergy}
						<div class="col-span-3 flex flex-row items-start justify-start">
							<h2 class="label">{$t('congregation.clergy.clergy')}</h2>
						</div>
						<div class="col-span-9 flex flex-row items-start justify-start">
							{congregation.clergy}
						</div>
					{/if}

					{#if !allFalse(services)}
						{#if congregation.clergy}<Separator class="col-span-12" />{/if}
						<Services {services} />
					{/if}

					{#if !allFalse(registration)}
						{#if congregation.clergy || !allFalse(services)}<Separator class="col-span-12" />{/if}
						<Registration {registration} />
					{/if}
				</div>
			</Tabs.Content>
			<Tabs.Content value="details">
				<div class="grid grid-cols-12 gap-4 text-sm">
					{#if fit.flag}
						<div class="col-span-3">
							<h2 class="label">{$t('congregation.fit.flag.short')}</h2>
						</div>
						<div class="col-span-9">
							{$t(`congregation.fit.flag.${fit.flag}`)}
						</div>
					{/if}

					{#if !allFalse(accessibility)}
						{#if fit.flag}<Separator class="col-span-12" />{/if}
						<Accessibility {accessibility} mode="full" />
					{/if}

					{#if health.protocol}
						{#if !allFalse(accessibility)}<Separator class="col-span-12" />{/if}
						<Health {health} />
					{/if}

					{#if !allFalse(security)}
						{#if health.protocol || !allFalse(accessibility)}<Separator class="col-span-12" />{/if}
						<Security {security} />
					{/if}

					{#if notes}
						{#if health.protocol || !allFalse(accessibility) || !allFalse(security)}<Separator
								class="col-span-12"
							/>{/if}
						<div class="col-span-3 flex flex-row items-start justify-start">
							<h2 class="label">{$t('congregation.notes.notes')}</h2>
						</div>
						<div class="col-span-9 flex flex-row items-start justify-start">
							<p>{notes}</p>
						</div>
					{/if}
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
