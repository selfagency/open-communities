<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount, tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	// removed wait-for-the-element: use native Svelte element binding instead

	import { dev } from '$app/environment';
	import { m } from '$lib/paraglide/messages';
	import { setState } from '$lib/stores';
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
		onResult() {
			setState({ loading: false });
		},
		onSubmit() {
			setState({ loading: true });
		},
		async onUpdate({ result }) {
			setState({ loading: false });
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
	let formEl: HTMLFormElement | null = null;
	let submitted = false;

	onMount(async () => {
		// Use the store API to update form data so test stubs that implement
		// set/subscribe/update work correctly.
		formData.update((fd: any) => ({ ...(fd ?? {}), token, type: 'verifyEmail' }));

		// wait a microtask so the conditional form has a chance to render and
		// bind to `formEl` (Svelte will do this on the next tick). Await twice
		// to be extra-safe in test environments.
		await tick();
		await tick();

		if (formEl && !submitted) {
			form.submit(formEl);
			submitted = true;
		}
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
