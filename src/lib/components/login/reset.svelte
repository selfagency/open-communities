<script lang="ts">
	import { isEmpty } from 'radashi';
	/* region imports */
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { waitForTheElement } from 'wait-for-the-element';

	import { dev } from '$app/environment';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	let {
		data,
		reset = $bindable(false),
		sent = $bindable(false),
		token
	}: {
		data: SuperValidated<any>;
		reset?: boolean;
		sent?: boolean;
		token: null | string;
	} = $props();
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		dataType: 'json',
		id: 'reset',
		onError({ result }) {
			log.error('submission error', result.error.message);
			toast.error(result.error.message);
		},
		async onUpdate({ result }) {
			if (result.type === 'success') {
				if ($formData.type === 'resetPassword') {
					reset = true;
				}
				if ($formData.type === 'requestReset') sent = true;
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form_errors);
				if (!isEmpty(result.data.form.errors))
					log.error('submission error', result.data.form_error);
				toast.error(m.resetFailure);
			}
		}
	});

	const { enhance, form: formData } = form;
	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		$formData.token = token ? token : 'invalid';
		$formData.type = token ? 'resetPassword' : 'requestReset';
		await waitForTheElement('#reset', { timeout: 1000 });
		const formEl = document.getElementById('reset') as HTMLFormElement;
		form.submit(formEl);
	});
	/* endregion lifecycle */
</script>

<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
	<form id="verify" method="POST" action="?/acct" use:enhance>
		<input type="hidden" name="token" bind:value={$formData.token} />
		<input type="hidden" name="type" bind:value={$formData.type} />

		{#if $formData.type === 'resetPassword'}
			<Form.Field {form} name="password">
				<Form.Control>
					{#snippet children(props)}
						<Form.Label>{m.password()}</Form.Label>
						<Input
							{...props}
							bind:value={$formData.password}
							required
							autocomplete="new-password"
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>
					{m.passwordRequirements()}
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="passwordConfirm">
				<Form.Control>
					{#snippet children(props)}
						<Form.Label>{m.confirmPassword()}</Form.Label>
						<Input
							{...props}
							bind:value={$formData.passwordConfirm}
							type="password"
							required
							autocomplete="new-password"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button>{m.resetPassword()}</Form.Button>
		{:else}
			<p class="mb-4">{m.resetNotice()}</p>

			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children(props)}
						<Form.Label>{m.email()}</Form.Label>
						<Input {...props} bind:value={$formData.email} required autocomplete="email" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button>{m.sendResetEmail()}</Form.Button>
		{/if}
	</form>

	{#if dev}
		{#await import('sveltekit-superforms') then { default: SuperDebug }}
			<div class="mt-4"><SuperDebug data={$formData} /></div>
		{/await}
	{/if}
</span>
