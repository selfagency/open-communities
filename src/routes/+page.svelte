<script lang="ts">
	/* region imports */
	import CloseIcon from 'lucide-svelte/icons/x';
	import { onMount } from 'svelte';

	import type { CongregationMetaRecord, PagesRecord } from '$lib/types';

	import Congregations from '$lib/components/congregations.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { t } from '$lib/i18n';
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

<Collapsible.Root>
	<Collapsible.Trigger>
		<CloseIcon size="18" />
	</Collapsible.Trigger>
	<Collapsible.Content>
		<section class="prose mx-auto mb-12">
			<h1 class="text-2xl">{$t('base.home.title')}</h1>
			{@html content?.content}
		</section>
	</Collapsible.Content>
</Collapsible.Root>

{#if congregations}
	<Congregations {congregations} />
{/if}
