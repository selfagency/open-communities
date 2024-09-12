<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import type { CongregationMetaRecord, PagesRecord } from '$lib/types';

	import Congregations from '$lib/components/congregation/congregations.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n';
	import { state, setState } from '$lib/stores';
	/* endregion imports */

	/* region variables */
	// props
	export let data;

	// local vars
	let congregations: CongregationMetaRecord & { id: string }[];
	let content: PagesRecord;
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		if (data) {
			congregations = data.congregations;
			content = data.page;
		}
	});
</script>

{#if content?.content}
	<Dialog.Root open={$state.showIntro} onOpenChange={() => setState({ showIntro: false })}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title class="text-xl">{$t('base.home.title')}</Dialog.Title>
				<Dialog.Description>
					<section class="prose mx-auto my-4">
						{@html content?.content}
					</section>
				</Dialog.Description>
			</Dialog.Header>
		</Dialog.Content>
	</Dialog.Root>
{/if}

{#if congregations}
	<Congregations {congregations} />
{/if}
