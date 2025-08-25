<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	// removed wait-for-the-element: use native Svelte element binding instead
	import { superForm, type SuperValidated } from 'sveltekit-superforms';

	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { setState } from '$lib/stores';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	let { data, verified = $bindable(false) }: { data: SuperValidated<any>; verified: boolean } =
		$props();

	let formEl: HTMLFormElement | null = $state(null);
	let submitted = $state(false);
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		dataType: 'json',
		id: 'verify',
		onError({ result }) {
			log.error('submission error', result.error.message);
			toast.error(m.verifyFailure);
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
				if (!isEmpty(result.data.form.errors)) {
					log.error('form errors', result.data.form.errors);
				}
				toast.error(m.verifyFailure);
			}
		}
	});

	const { enhance, form: formData } = form;
	/* endregion form */

	/* region lifecycle */
	onMount(() => {
		$formData.token = page.url.searchParams.get('verifyEmail');
		$formData.type = 'verifyEmail';
	});

	$effect(() => {
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
