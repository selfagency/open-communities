<script lang="ts">
	/* region imports */
	import Page from '$lib/components/global/page.svelte';

	import type { PageData } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const data: PageData = $props();

	// locals
	let content = $derived(data.content);
	/* endregion variables */
</script>

<Page {content} />
