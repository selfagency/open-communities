<script lang="ts">
	/* region imports */
	import Page from '$lib/components/global/page.svelte';

	import type { PageProps } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const { data }: PageProps = $props();

	// locals
	const content = $derived(data.content);
	/* endregion variables */
</script>

<Page {content} />
