<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { waitForTheElement } from 'wait-for-the-element';

	import { dev } from '$app/environment';
	import { m } from '$lib/paraglide/messages';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	let {
		data,
		token,
		verified = $bindable(false)
	}: { data: SuperValidated<any>; token: null | string; verified: boolean } = $props();
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		dataType: 'json',
		id: 'verify',
		onError({ result }) {
			log.error('submission error', result.error.message);
			toast.error(result.error.message);
		},
		async onUpdate({ result }) {
			if (result.type === 'success') {
				verified = true;
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form_errors);
				if (!isEmpty(result.data.form.errors))
					log.error('submission error', result.data.form_error);
				toast.error(m.verifyFailure);
			}
		}
	});

	const { enhance, form: formData } = form;
	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		$formData.token = token;
		$formData.type = 'verifyEmail';
		await waitForTheElement('#verify', { timeout: 1000 });
		const formEl = document.getElementById('verify') as HTMLFormElement;
		form.submit(formEl);
	});
	/* endregion lifecycle */
</script>

<div
	in:fade={{ delay: 200, duration: 100 }}
	out:fade={{ delay: 0, duration: 100 }}
	class="space-y-4"
>
	<div>{m.verifying()}</div>

	{#if $formData.token && $formData.type}
		<form id="verify" method="POST" action="?/acct" use:enhance>
			<input type="hidden" name="token" bind:value={$formData.token} />
			<input type="hidden" name="type" bind:value={$formData.type} />
		</form>
	{/if}

	{#if dev}
		{#await import('sveltekit-superforms') then { default: SuperDebug }}
			<div class="mt-4"><SuperDebug data={$formData} /></div>
		{/await}
	{/if}
</div>
