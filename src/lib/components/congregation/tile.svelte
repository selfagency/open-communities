<script lang="ts">
	/* region imports */
	import type {
		CongregationMetaRecord,
		AccommodationsRecord,
		CitiesRecord as City,
		CountriesRecord as Country,
		StatesRecord as State
	} from '$lib/types';

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { user } from '$lib/stores';

	import Accommodations from './accommodations.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregation: CongregationMetaRecord & { id: string };

	// constants
	const accommodations = congregation.accommodations as AccommodationsRecord;
	const location = congregation.location as { city: City; state: State; country: Country };
	/* endregion variables */
</script>

<Card.Root class="text-left">
	<Card.Header>
		<Card.Title class="font-display text-xl leading-4 tracking-wide">{congregation.name}</Card.Title
		>
		<Card.Description>
			{#if location.city.name}<span>{location.city.name}</span
				>{#if location.state.name || location.country.name},{/if}{/if}
			{#if location.state.name}<span>{location.state.name}</span
				>{#if location.country.name && location.country.name !== 'United States'},{/if}{/if}
			{#if location.country.name && location.country.name !== 'United States'}<span
					>{location.country.name}</span
				>{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<p class="line-clamp-3">{congregation.flavor}</p>
	</Card.Content>
	{#if accommodations || $user.admin}
		<Card.Footer>
			{#if $user.admin}
				<Button
					on:click={async (e) => {
						e.stopPropagation();
						await goto(`/edit?id=${congregation.id}`);
					}}>Edit</Button
				>
			{/if}
			{#if accommodations}
				<Accommodations {accommodations} mode="mini" />
			{/if}
		</Card.Footer>
	{/if}
</Card.Root>
