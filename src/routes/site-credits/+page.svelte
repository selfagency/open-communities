<script lang="ts">
	/* region imports */
	import Page from '$lib/components/global/page.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data: any;

	// local vars
	let content;
	/* endregion variables */

	/* region reactivity */
	$: if (data.content) content = data.content;
	/* endregion reactivity */
</script>

<Page {content} />
