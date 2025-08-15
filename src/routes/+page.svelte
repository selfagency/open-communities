<script lang="ts">
	/* region imports */
	import Welcome from '$lib/components/global/welcome.svelte';
	import Congregations from '$lib/components/search/congregations.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import { state as appState, setState } from '$lib/stores';
	// import { log } from '$lib/utils';

	import type { PageData } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const data: PageData = $props();

	const { content } = $derived(data);
	/* endregion variables */
</script>

{#if content?.content}
	<Dialog.Root open={$appState.showIntro} onOpenChange={() => setState({ showIntro: false })}>
		<Dialog.Content
			class="max-h-[85vh] max-w-[360px] min-w-[360px] overflow-y-scroll sm:max-w-[540px]"
		>
			<Dialog.Header>
				<Dialog.Title class="font-display text-2xl font-normal">
					{m.home_dialogTitle()}
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

<Congregations />
