<script lang="ts">
	/* region imports */
	import { isArray, isEmpty } from 'radashi';
	import { onMount } from 'svelte';

	import type { CongregationMetaRecord, PagesRecord } from '$lib/types';

	import Welcome from '$lib/components/global/welcome.svelte';
	import Congregations from '$lib/components/search/congregations.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n';
	import { state as appState, setState } from '$lib/stores';
	import { log } from '$lib/utils';

	import type { PageData } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const data: PageData = $props();

	// locals
	let congregations: CongregationMetaRecord & { id: string }[] = $derived(data.congregations || []);
	let content: PagesRecord = $derived(data.content || ({} as PagesRecord));
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		if (!isEmpty(data) && isArray(data.countries)) {
			setState({ countries: data.countries });
		} else {
			log.error($t('common.errors.countriesFailed'));
		}
	});
</script>

{#if content?.content}
	<Dialog.Root open={$appState.showIntro} onOpenChange={() => setState({ showIntro: false })}>
		<Dialog.Content
			class="max-h-[85vh] max-w-[360px] min-w-[360px] overflow-y-scroll sm:max-w-[540px]"
		>
			<Dialog.Header>
				<Dialog.Title class="font-display text-2xl font-normal">
					{$t('common.home.dialogTitle')}
				</Dialog.Title>
				<Dialog.Description>
					<section class="prose mx-auto my-4">
						{@html content?.content}
					</section>
				</Dialog.Description>
			</Dialog.Header>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<Welcome />

{#if congregations}
	<Congregations {congregations} />
{/if}
