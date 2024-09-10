<script lang="ts">
	/* region imports */

	import type { CongregationMetaRecord, AccommodationsRecord } from '$lib/types';

	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n';

	import Accommodations from './accommodations.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let congregation: CongregationMetaRecord;

	// constants
	const accommodations = congregation.accommodations as AccommodationsRecord;
	/* endregion variables */
</script>

<Dialog.Root>
	<Dialog.Trigger>
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
					<p class="line-clamp-3">{congregation.description}</p>
				</Card.Content>
				<Card.Footer>
					<Accommodations {accommodations} />
				</Card.Footer>
			</Card.Root>
		</div>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{congregation.name}</Dialog.Title>
			<Dialog.Description>
				<span>{congregation.city}</span>,
				<span>{congregation.state}</span>{#if congregation.country !== 'US'}<span
						>, {congregation.country}</span
					>{/if}
			</Dialog.Description>
		</Dialog.Header>

		<p>{congregation.description}</p>

		<Accommodations {accommodations} mode="full" />
	</Dialog.Content>
</Dialog.Root>
