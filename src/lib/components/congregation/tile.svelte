<script lang="ts">
	/* region imports */
	import type { CongregationMetaRecord, AccommodationsRecord } from '$lib/types';

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
	/* endregion variables */
</script>

<div class="text-left">
	<Card.Root>
		<Card.Header>
			<Card.Title>{congregation.name}</Card.Title>
			<Card.Description>
				<span>{congregation.city}</span>,
				<span>{congregation.state}</span>{#if congregation.country !== 'US'}<span
						>, {congregation.country}</span
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
</div>
