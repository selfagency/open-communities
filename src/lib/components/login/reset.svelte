<script lang="ts">
	import { isEmpty } from 'radashi';
	/* region imports */
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { waitForTheElement } from 'wait-for-the-element';

	import { dev } from '$app/environment';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	export let token: string | null;
	export let reset: boolean = false;
	export let sent: boolean = false;
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		id: 'reset',
		dataType: 'json',
		async onUpdate({ result }) {
			if (result.type === 'success') {
				if ($formData.type === 'resetPassword') {
					reset = true;
				}
				if ($formData.type === 'requestReset') sent = true;
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.error)) log.error('submission error', result.data.form.error);
				toast.error($t('auth.resetFailure'));
			}
		},
		onError({ result }) {
			log.error('submission error', result.error.message);
			toast.error(result.error.message);
		}
	});

	const { form: formData, enhance } = form;
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

<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ duration: 100, delay: 0 }}>
	<form id="verify" method="POST" action="?/acct" use:enhance>
		<input type="hidden" name="token" bind:value={$formData.token} />
		<input type="hidden" name="type" bind:value={$formData.type} />

		{#if $formData.type === 'resetPassword'}
			<Form.Field {form} name="password">
				<Form.Control let:attrs>
					<Form.Label>{$t('auth.password')}</Form.Label>
					<Input {...attrs} bind:value={$formData.password} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="passwordConfirm">
				<Form.Control let:attrs>
					<Form.Label>{$t('auth.confirmPassword')}</Form.Label>
					<Input {...attrs} bind:value={$formData.passwordConfirm} type="password" required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button>{$t('auth.resetPassword')}</Form.Button>
		{:else}
			<p class="mb-4">{$t('auth.resetNotice')}</p>

			<Form.Field {form} name="email">
				<Form.Control let:attrs>
					<Form.Label>{$t('common.email')}</Form.Label>
					<Input {...attrs} bind:value={$formData.email} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button>{$t('auth.sendResetEmail')}</Form.Button>
		{/if}
	</form>

	{#if dev}
		{#await import('sveltekit-superforms') then { default: SuperDebug }}
			<div class="mt-4"><SuperDebug data={$formData} /></div>
		{/await}
	{/if}
</span>
