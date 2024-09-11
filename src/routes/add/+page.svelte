<script lang="ts">
	/* region imports */
	import AddForm from '$lib/components/congregation/form.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data;
	/* endregion variables */
</script>

<AddForm data={data.form} content={data.content} />
