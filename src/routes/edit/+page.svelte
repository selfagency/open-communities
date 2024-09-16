<svelte:options accessors />

<script lang="ts">
	/* region imports */
	import { setContext } from 'svelte';

	import EditForm from '$lib/components/congregation/form.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data;
	export let snapshot;
	/* endregion variables */

	/* region lifecycle */
	setContext('congregation', data.congregation);
	/* endregion lifecycle */
</script>

<EditForm data={data.form} mode="edit" bind:snapshot />
