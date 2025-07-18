<script lang="ts">
	/* region imports */
	import EditIcon from 'lucide-svelte/icons/pencil';

	import type {
		AccessibilityRecord,
		CitiesRecord as City,
		CongregationMetaRecord,
		CountriesRecord as Country,
		HealthRecord,
		SecurityRecord,
		ServicesRecord,
		StatesRecord as State
	} from '$lib/pocketbase.d';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as m from '$lib/paraglide/messages';

	import Accessibility from './accessibility.svelte';
	import Health from './health.svelte';
	import Security from './security.svelte';
	/* endregion imports */

	/* region variables */
	// props
	const { congregation }: { congregation: CongregationMetaRecord & { id: string } } = $props();

	// constants
	const user = $derived(page.data.user);
	const accessibility = $derived(congregation?.accessibility) as AccessibilityRecord;
	const health = $derived(congregation?.health) as HealthRecord;
	const services = $derived(congregation?.services) as ServicesRecord;
	const security = $derived(congregation?.security) as SecurityRecord;
	const location = $derived(congregation?.location) as {
		city: City;
		country: Country;
		state: State;
	};
	/* endregion variables */
</script>

<Card.Root
	class="h-full min-h-max transition-transform hover:scale-105 ltr:text-left rtl:text-right"
>
	<Card.Header>
		<Card.Title>
			<h1 class="font-display text-xl leading-6 font-normal tracking-wide">
				{congregation.name}
			</h1>
		</Card.Title>
		<Card.Description>
			{#if services.onlineOnly}
				<span>{m.services.onlineOnly()}</span
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
	{#if accessibility || user?.admin}
		<Card.Footer>
			<div class="flex w-full flex-row items-center justify-between space-x-2">
				{#if user?.admin}
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="ghost"
									class="h-8 px-2 py-0"
									onclick={async (e: Event) => {
										e.preventDefault();
										e.stopPropagation();
										await goto(`/edit?id=${congregation.id}`);
									}}
								>
									<EditIcon size="16" class="text-slate-700" />
									<span class="sr-only">{m.edit()}</span>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<span class="text-nowrap">{m.edit()}</span>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				{/if}
				<div class="flex w-auto flex-row items-center justify-end space-x-1">
					{#if !congregation.visible}
						<Badge variant="outline">{m.pending()}</Badge>
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
