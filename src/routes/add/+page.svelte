<svelte:options accessors />

<script lang="ts">
	/* region imports */
	import AddForm from '$lib/components/form/form.svelte';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let data;
	export let snapshot;
	/* endregion variables */
</script>

<svelte:head>
	<title>{$t('congregation.addCongregation')} &middot; {$t('common.title')}</title>
</svelte:head>

<AddForm data={data.form} content={data.content} bind:snapshot />
