<script lang="ts">
	/* region imports */
	import EditForm from '$lib/components/congregation/form.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data;
	/* endregion variables */
</script>

<EditForm data={data.form} mode="edit" />
