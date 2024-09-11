<script lang="ts">
	/* region imports */
	import { superForm } from 'sveltekit-superforms';
	/* endregion imports */

	/* region variables */
	// props
	export let data;

	// constants
	const { form, errors, constraints, message, enhance } = superForm(data.form);
	/* endregion variables */
</script>
