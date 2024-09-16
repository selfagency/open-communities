<svelte:options accessors />

<script lang="ts">
	/* region imports */
	import AddForm from '$lib/components/congregation/form.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data;
	export let snapshot;
	/* endregion variables */
</script>

<AddForm data={data.form} content={data.content} bind:snapshot />
