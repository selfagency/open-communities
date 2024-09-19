<script lang="ts">
	/* region imports */
	import EditIcon from 'lucide-svelte/icons/pencil';

	import type {
		CongregationMetaRecord,
		AccessibilityRecord,
		CitiesRecord as City,
		CountriesRecord as Country,
		ServicesRecord,
		StatesRecord as State,
		SecurityRecord,
		HealthRecord
	} from '$lib/types';

	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores';

	import Accessibility from './accessibility.svelte';
	import Health from './health.svelte';
	import Security from './security.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregation: CongregationMetaRecord & { id: string };

	// constants
	const accessibility = congregation?.accessibility as AccessibilityRecord;
	const health = congregation?.health as HealthRecord;
	const services = congregation?.services as ServicesRecord;
	const security = congregation?.security as SecurityRecord;
	const location = congregation?.location as { city: City; state: State; country: Country };
	/* endregion variables */
</script>

<Card.Root class="h-full min-h-max text-left transition-transform hover:scale-105">
	<Card.Header>
		<Card.Title class="font-display text-xl leading-6 tracking-wide">{congregation.name}</Card.Title
		>
		<Card.Description>
			{#if services.onlineOnly}
				<span>{$t('congregation.services.onlineOnly')}</span
				>{#if location.country.name && location.country.name !== 'United States'}<span
						>, {location.country.name}</span
					>{/if}
			{:else if location.city.name || location.state.name || location.country.name}
				{#if location.city.name}<span>{location.city.name}</span
					>{#if location.state.name || location.country.name},{/if}{/if}
				{#if location.state.name}<span>{location.state.name}</span
					>{#if location.country.name && location.country.name !== 'United States'},{/if}{/if}
				{#if location.country.name && location.country.name !== 'United States'}<span
						>{location.country.name}</span
					>{/if}
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<p class="line-clamp-3 text-sm">{congregation.flavor}</p>
	</Card.Content>
	{#if accessibility || $user.admin}
		<Card.Footer>
			<div class="flex w-full flex-row items-center justify-between space-x-2">
				{#if $user.admin}
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="ghost"
								class="h-8 px-2 py-0"
								on:click={async () => {
									await goto(`/edit?id=${congregation.id}`);
								}}
							>
								<EditIcon size="16" class="text-slate-700" />
							</Button>
							<span class="sr-only">{$t('common.edit')}</span>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<span class="text-nowrap">{$t('common.edit')}</span>
						</Tooltip.Content>
					</Tooltip.Root>
				{/if}
				<div class="flex w-auto flex-row items-center justify-end space-x-1">
					{#if !congregation.visible}
						<Badge variant="outline">{$t('common.pending')}</Badge>
					{:else}
						{#if security}
							<Security {security} mode="mini" />
						{/if}
						{#if health}
							<Health {health} mode="mini" />
						{/if}
						{#if accessibility}
							<Accessibility {accessibility} mode="mini" />
						{/if}
					{/if}
				</div>
			</div>
		</Card.Footer>
	{/if}
</Card.Root>
