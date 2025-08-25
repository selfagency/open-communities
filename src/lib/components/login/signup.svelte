<script lang="ts">
	/* region imports */
	import type { SuperForm, SuperValidated } from 'sveltekit-superforms';

	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import Captcha from '$lib/components/global/captcha.svelte';
	import Verify from '$lib/components/login/verify.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	import { state as appState, setState } from '$lib/stores';
	// import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	let { form, verify }: { form: SuperForm<any>; verify: SuperValidated<any> } = $props();

	// locals
	let verified: boolean = $state(false);
	// let captchaLoaded: boolean = false;

	// constants
	const verifying = $derived(page.url.searchParams.has('verifyEmail'));
	/* endregion variables */

	/* region form */
	const { enhance, form: formData } = form;
	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		setState({ form: { hasErrors: false, success: false }, loadingSecondary: false });
		$formData.emailVisibility = true;
		$formData.lang = 'en';
	});
	/* endregion lifecycle */
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="font-display text-2xl font-normal">
			{verifying ? m.verifyEmail() : m.signUp()}
		</Card.Title>
		<!-- <Card.Description></Card.Description> -->
	</Card.Header>
	<Card.Content>
		{#if verifying && !verified}
			<Verify data={verify} bind:verified token={page.url.searchParams.get('verifyEmail')} />
		{:else if verified}
			<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
				{m.verified_extended()}
			</span>
		{:else if $appState.form?.success}
			<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
				{m.signUpSuccess()}
			</span>
		{:else}
			<div class="mb-4">{m.signUpInfo()}</div>

			<form
				method="POST"
				action="?/signup"
				use:enhance
				class="space-y-2"
				in:fade={{ delay: 200, duration: 100 }}
				out:fade={{ delay: 0, duration: 100 }}
			>
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m.name()}</Form.Label>
							<Input {...props} bind:value={$formData.name} autocomplete="name" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m.email()}</Form.Label>
							<Input {...props} bind:value={$formData.email} autocomplete="email" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m.password()}</Form.Label>
							<Input
								{...props}
								bind:value={$formData.password}
								type="password"
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
								autocomplete="new-password"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Captcha {form} />>

				<div class="mt-4"><Form.Button>{m.signUp()}</Form.Button></div>
			</form>

			{#if dev}
				{#await import('sveltekit-superforms') then { default: SuperDebug }}
					<div class="mt-4"><SuperDebug data={$formData} /></div>
				{/await}
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
