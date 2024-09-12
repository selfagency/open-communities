<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { joi } from 'sveltekit-superforms/adapters';
	import { waitForTheElement } from 'wait-for-the-element';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { tokenSchema } from '$lib/schemas';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	export let token: string | null;
	export let reset: boolean = false;
	export let resetting: boolean = false;
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		id: 'reset',
		dataType: 'json',
		validators: joi(tokenSchema),
		async onUpdate({ result }) {
			if (!isEmpty(result.data.form.errors)) {
				log.error(JSON.stringify(result.data.form.errors));
				if (result.data.form.errors.error) {
					toast.error(result.data.form.errors.error);
				}
			} else if (result.type === 'success') {
				reset = true;
				resetting = false;
			}
		},
		onError({ result }) {
			log.error(result.error.message);
			toast.error(result.error.message);
		}
	});

	const { form: formData, enhance } = form;
	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		$formData.token = token;
		$formData.type = 'resetPassword';
		await waitForTheElement('#reset', { timeout: 1000 });
		const formEl = document.getElementById('reset') as HTMLFormElement;
		form.submit(formEl);
	});
	/* endregion lifecycle */
</script>

<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ duration: 100, delay: 0 }}>
	{#if $formData.token && $formData.type}
		<form id="verify" method="POST" action="?/acct" use:enhance>
			<input type="hidden" name="token" bind:value={$formData.token} />
			<input type="hidden" name="type" bind:value={$formData.type} />

			<Form.Field {form} name="password">
				<Form.Control let:attrs>
					<Form.Label>{$t('base.auth.password')}</Form.Label>
					<Input {...attrs} bind:value={$formData.password} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="passwordConfirm">
				<Form.Control let:attrs>
					<Form.Label>{$t('base.auth.confirmPassword')}</Form.Label>
					<Input {...attrs} bind:value={$formData.passwordConfirm} type="password" />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button>{$t('base.auth.resetPassword')}</Form.Button>
		</form>
	{/if}
</span>
