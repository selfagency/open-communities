<script lang="ts">
	/* region imports */
	import { m } from '$lib/paraglide/messages';
	/* endregion imports */

	/* region variables */
	// props
	const { content }: { content: { content: string; title: string } } = $props();
	/* endregion variables */
</script>

<svelte:head>
	<title>{content.title} &middot; {m.title()}</title>
</svelte:head>

<section>
	{#if content}
		<h1 class="text-3xl">{content.title}</h1>
		<div class="prose max-w-none" class:content>
			{@html content.content}
		</div>
	{/if}
</section>
