<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';

	import { page } from '$app/stores';
	import Verify from '$lib/components/login/verify.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { userSchema } from '$lib/schemas';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	export let verify: SuperValidated<any>;

	// local vars
	let success: boolean = false;
	let verified: boolean = false;
	let verifying: boolean = false;
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		id: 'signup',
		dataType: 'json',
		validators: zod(userSchema),
		async onUpdate({ result }) {
			if (!isEmpty(result.data.form.errors)) {
				log.error(JSON.stringify(result.data.form.errors));
				if (result.data.form.errors.error) {
					toast.error(result.data.form.errors.error);
				}
			} else if (result.type === 'success') {
				success = true;
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
	onMount(() => {
		if ($page.url.searchParams.has('verifyEmail')) {
			verifying = true;
		}
	});
	/* endregion lifecycle */
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="font-display text-2xl">{$t('auth.signUp')}</Card.Title>
		<!-- <Card.Description></Card.Description> -->
	</Card.Header>
	<Card.Content>
		{#if verifying && !verified}
			<Verify data={verify} bind:verified token={$page.url.searchParams.get('verifyEmail')} />
		{:else if verified}
			<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ duration: 100, delay: 0 }}>
				{$t('auth.verified.extended')}
			</span>
		{:else if success}
			<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ duration: 100, delay: 0 }}>
				{$t('auth.signUpSuccess')}
			</span>
		{:else}
			<div class="mb-4">{$t('auth.signUpInfo')}</div>

			<form
				method="POST"
				action="?/signup"
				use:enhance
				class="space-y-2"
				in:fade={{ delay: 200, duration: 100 }}
				out:fade={{ duration: 100, delay: 0 }}
			>
				<Form.Field {form} name="name">
					<Form.Control let:attrs>
						<Form.Label>{$t('auth.name')}</Form.Label>
						<Input {...attrs} bind:value={$formData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="email">
					<Form.Control let:attrs>
						<Form.Label>{$t('common.email')}</Form.Label>
						<Input {...attrs} bind:value={$formData.email} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="password">
					<Form.Control let:attrs>
						<Form.Label>{$t('auth.password')}</Form.Label>
						<Input {...attrs} bind:value={$formData.password} type="password" />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="passwordConfirm">
					<Form.Control let:attrs>
						<Form.Label>{$t('auth.confirmPassword')}</Form.Label>
						<Input {...attrs} bind:value={$formData.passwordConfirm} type="password" />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button>{$t('auth.signUp')}</Form.Button>
			</form>
		{/if}
	</Card.Content>
	<!-- <Card.Footer></Card.Footer> -->
</Card.Root>
