<script lang="ts">
	/* region imports */
	import { isEmpty, isArray } from 'radashi';
	import { onMount } from 'svelte';

	import type { CongregationMetaRecord, PagesRecord } from '$lib/types';

	import Congregations from '$lib/components/congregation/congregations.svelte';
	import Welcome from '$lib/components/global/welcome.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n';
	import { state, setState } from '$lib/stores';
	import { log } from '$lib/utils';
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
		if (!isEmpty(data)) {
			if (isArray(data.congregations)) {
				congregations = data.congregations;
			} else {
				log.error($t('common.errors.congregationFailed'));
			}

			if (!isEmpty(data.content)) {
				content = data.content;
			} else {
				log.error($t('common.errors.pageFailed'));
			}

			if (isArray(data.countries)) {
				setState({ countries: data.countries });
			} else {
				log.error($t('common.errors.countriesFailed'));
			}
		} else {
			log.error($t('common.errors.dataFailed'));
		}
	});
</script>

{#if content?.content}
	<Dialog.Root open={$state.showIntro} onOpenChange={() => setState({ showIntro: false })}>
		<Dialog.Content
			class="max-h-[85vh] min-w-[360px] max-w-[360px] overflow-y-scroll sm:max-w-[540px]"
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
