<script lang="ts">
	import { onMount } from 'svelte';

	/* region imports */
	import type { UsersRecord } from '$lib/pocketbase.d';

	import AddForm from '$lib/components/form/form.svelte';
	import { initForm } from '$lib/form';
	import { m } from '$lib/paraglide/messages';
	import { setState } from '$lib/stores';

	import type { PageProps } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const { data }: PageProps = $props();

	const form = initForm(data.form.default, 'add', data.user?.admin);

	export const snapshot = { capture: form.capture, restore: form.restore };
	/*endregion variables */

	/* region lifecycle */
	onMount(() => {
		setState({ form: { hasErrors: false, success: false }, loadingSecondary: false });
	});
	/*endregion lifecycle */
</script>

<svelte:head>
	<title>{m.addCongregation()} &middot; {m.title()}</title>
</svelte:head>

<AddForm
	{form}
	content={data.content}
	mode="add"
	user={data.user as UsersRecord & { id: string }}
/>
