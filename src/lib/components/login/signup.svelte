<script lang="ts">
	/* region imports */
	import { isEmpty, sleep } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';

	import { browser, dev } from '$app/environment';
	import { page } from '$app/state';
	import { PUBLIC_PROSOPO_SITE_KEY } from '$env/static/public';
	import Verify from '$lib/components/login/verify.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as m from '$lib/paraglide/messages';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	let {
		data,
		snapshot = $bindable({}),
		verify
	}: { data: SuperValidated<any>; snapshot: unknown; verify: SuperValidated<any> } = $props();

	// locals
	let success: boolean = $state(false);
	let verified: boolean = $state(false);
	// let captchaLoaded: boolean = false;

	// constants
	const verifying = $derived(page.url.searchParams.has('verifyEmail'));
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		dataType: 'json',
		id: 'signup',
		onError({ result }) {
			log.error('submission error', result.error.message);
			toast.error(result.error.message);
		},
		async onUpdate({ result }) {
			if (result.type === 'success') {
				success = true;
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.error)) log.error('submission error', result.data.form.error);
				toast.error(m.signUpFailure);
			}
		}
	});

	const { capture, enhance, form: formData, restore } = form;
	snapshot = { capture, restore };
	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		if (browser) {
			await sleep(1500);
			const captchaContainer = document.getElementById('captcha');
			if (captchaContainer) {
				window['procaptcha']?.render(captchaContainer, {
					callback: (token) => {
						$formData.captcha = token;
					},
					captchaType: 'frictionless',
					siteKey: PUBLIC_PROSOPO_SITE_KEY,
					theme: 'light'
				});
			}

			$formData.emailVisibility = true;
			$formData.lang = 'en';
		}
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="font-display text-2xl font-normal"
			>{verifying ? m.verifyEmail') : $t('auth.signUp}</Card.Title
		>
		<!-- <Card.Description></Card.Description> -->
	</Card.Header>
	<Card.Content>
		{#if verifying && !verified}
			<Verify data={verify} bind:verified token={page.url.searchParams.get('verifyEmail')} />
		{:else if verified}
			<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
				{m.verified.extended}
			</span>
		{:else if success}
			<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
				{m.signUpSuccess}
			</span>
		{:else}
			<div class="mb-4">{m.signUpInfo}</div>

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
							<Form.Label>{m.name}</Form.Label>
							<Input {...props} bind:value={$formData.name} autocomplete="name" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m.email}</Form.Label>
							<Input {...props} bind:value={$formData.email} autocomplete="email" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m.password}</Form.Label>
							<Input
								{...props}
								bind:value={$formData.password}
								type="password"
								autocomplete="new-password"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="passwordConfirm">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m.confirmPassword}</Form.Label>
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

				<Form.Field {form} name="captcha">
					<Form.Control>
						<div id="captcha" class="w-full pt-3"></div>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button>{m.signUp}</Form.Button>
			</form>

			{#if dev}
				{#await import('sveltekit-superforms') then { default: SuperDebug }}
					<div class="mt-4"><SuperDebug data={$formData} /></div>
				{/await}
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
