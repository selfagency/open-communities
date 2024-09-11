<script lang="ts">
	/* region imports */
	import type { CongregationMetaRecord, AccommodationsRecord } from '$lib/types';

	import * as Card from '$lib/components/ui/card';

	import Accommodations from './accommodations.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregation: CongregationMetaRecord;

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
		<Card.Footer>
			{#if congregation.notes}
				<p>{congregation.notes}</p>
			{/if}

			{#if accommodations}
				<Accommodations {accommodations} mode="mini" />
			{/if}
		</Card.Footer>
	</Card.Root>
</div>
