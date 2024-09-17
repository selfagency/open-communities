<svelte:options accessors />

<script lang="ts">
	/* region imports */
	import Contact from '$lib/components/global/contact.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data: any;
	export let snapshot: any;
	/* endregion variables */
</script>

<section class="flex h-full w-full flex-col items-center justify-center" style="min-height: 50vh;">
	<Contact data={data.form} congregations={data.congregations} bind:snapshot />
</section>
