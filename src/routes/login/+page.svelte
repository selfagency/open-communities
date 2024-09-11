<script lang="ts">
	/* region imports */
	import Login from '$lib/components/login.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data;
	/* endregion variables */
</script>

<Login data={data.form} />
