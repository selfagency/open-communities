<script lang="ts">
	/* region imports */
	import { sleep, isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';

	import { dev, browser } from '$app/environment';
	import { page } from '$app/stores';
	import { PUBLIC_PROSOPO_SITEKEY } from '$env/static/public';
	import Verify from '$lib/components/login/verify.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	export let verify: SuperValidated<any>;
	export let snapshot: any;
	// export let active: boolean = false;

	// local vars
	let success: boolean = false;
	let verified: boolean = false;
	let verifying: boolean = false;
	// let captchaLoaded: boolean = false;
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		id: 'signup',
		dataType: 'json',
		async onUpdate({ result }) {
			if (result.type === 'success') {
				if ($formData.type === 'resetPassword') {
					success = true;
				}
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.error)) log.error('submission error', result.data.form.error);
				toast.error($t('auth.signUpFailure'));
			}
		},
		onError({ result }) {
			log.error('submission error', result.error.message);
			toast.error(result.error.message);
		}
	});

	const { form: formData, enhance, capture, restore } = form;
	snapshot = { capture, restore };
	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		if (browser) {
			await sleep(1500);
			const captchaContainer = document.getElementById('captcha');
			window['procaptcha']?.render(captchaContainer, {
				siteKey: PUBLIC_PROSOPO_SITEKEY,
				theme: 'light',
				captchaType: 'frictionless',
				callback: (token) => {
					$formData.captcha = token;
				}
			});

			$formData.emailVisibility = true;
			$formData.lang = 'en';
		}
	});

	/* region reactivity */
	$: if ($page.url.searchParams.has('verifyEmail')) {
		verifying = true;
	}
	/* endregion reactivity */
</script>

<svelte:head>
	<script
		type="module"
		id="procaptcha-script"
		src="https://js.prosopo.io/js/procaptcha.bundle.js"
		async
		defer
	></script>
</svelte:head>

<Card.Root>
	<Card.Header>
		<Card.Title class="font-display text-2xl font-normal"
			>{verifying ? $t('auth.verifyEmail') : $t('auth.signUp')}</Card.Title
		>
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

				<Form.Field {form} name="captcha">
					<Form.Control>
						<div id="captcha" class="w-full pt-3"></div>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button>{$t('auth.signUp')}</Form.Button>
			</form>

			{#if dev}
				{#await import('sveltekit-superforms') then { default: SuperDebug }}
					<div class="mt-4"><SuperDebug data={$formData} /></div>
				{/await}
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
