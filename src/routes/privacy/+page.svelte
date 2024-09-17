<script lang="ts">
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

<section>
	{#if content}
		<h1 class="text-3xl">{content.title}</h1>
		<div class="prose max-w-none" class:content>
			{@html content.content}
		</div>
	{/if}
</section>
