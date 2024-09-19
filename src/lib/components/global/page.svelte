<script lang="ts">
	/* region imports */
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let content: any;
	/* endregion variables */
</script>

<svelte:head>
	<title>{content.title} &middot; {$t('common.title')}</title>
</svelte:head>

<section>
	{#if content}
		<h1 class="text-3xl">{content.title}</h1>
		<div class="prose max-w-none" class:content>
			{@html content.content}
		</div>
	{/if}
</section>
