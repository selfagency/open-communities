<svelte:options accessors />

<script lang="ts">
	/* region imports */
	import { sleep } from 'radashi';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import { browser, dev } from '$app/environment';
	import { page } from '$app/stores';
	import { PUBLIC_PROSOPO_SITEKEY } from '$env/static/public';
	import * as Card from '$lib/components/ui/card';
	import Combobox from '$lib/components/ui/combobox/index.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: any;
	export let snapshot: any;
	export let congregations: any;

	// local vars
	let success: boolean = false;
	let congregation: string = '';
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		id: 'signup',
		dataType: 'json',
		async onUpdate({ result, form: f }) {
			if (!f.valid || result.type !== 'success') {
				log.error('form error', result.data.form.errors);
				if (result.data.form.error) {
					log.error('submission error', result.data.form.error);
					toast.error($t('common.emailFailure'));
				}
			} else if (result.type === 'success') {
				toast.success($t('common.emailSuccess'));
				success = true;
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
		}

		if (!$formData.reason) $formData.reason = 'question';
		if (!$formData.name) $formData.name = $user.name ?? '';
		if (!$formData.email) $formData.email = $user.email ?? '';
		if (!$formData.record) $formData.record = '';
		if (!$formData.message) $formData.message = '';
		if (!$formData.captcha) $formData.captcha = '';
	});
	/* endregion lifecycle */

	/* region reactivity */
	$: if ($page.url.searchParams.has('claim')) {
		$formData.reason = 'claim';
		congregation = $page.url.searchParams.get('claim') as string;
		$formData.record = congregation;
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

<Card.Root class="mx-auto w-full max-w-md">
	<Card.Header>
		<Card.Title class="font-display text-2xl font-normal">
			{$t('common.contact.contactUs')}
		</Card.Title>
		<!-- <Card.Description></Card.Description> -->
	</Card.Header>
	<Card.Content>
		{#if success}
			<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ duration: 100, delay: 0 }}>
				{$t('common.emailSuccessNotice')}
			</span>
		{:else}
			<form
				method="POST"
				use:enhance
				class="space-y-2"
				in:fade={{ delay: 200, duration: 100 }}
				out:fade={{ duration: 100, delay: 0 }}
			>
				<Form.Field {form} name="name">
					<Form.Control let:attrs>
						<Form.Label>{$t('auth.name')}</Form.Label>
						<Input {...attrs} bind:value={$formData.name} required />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="email">
					<Form.Control let:attrs>
						<Form.Label>{$t('common.email')}</Form.Label>
						<Input {...attrs} bind:value={$formData.email} required />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="reason">
					<Form.Control let:attrs>
						<Form.Label>{$t('common.contact.reason')}</Form.Label>
						<Select.Root
							selected={{
								label: $t(`common.contact.options.${$formData.reason}`),
								value: $formData.reason
							}}
							onSelectedChange={(v) => {
								$formData.reason = v?.value;
							}}
						>
							<Select.Trigger class="w-full">
								<Select.Value />
							</Select.Trigger>
							<Select.Content {...attrs}>
								<Select.Item value="question">{$t('common.contact.options.question')}</Select.Item>
								<Select.Item value="suggest">{$t('common.contact.options.suggest')}</Select.Item>
								<Select.Item value="claim">{$t('common.contact.options.claim')}</Select.Item>
								<Select.Item value="delete">{$t('common.contact.options.delete')}</Select.Item>
							</Select.Content>
						</Select.Root>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				{#if $formData.reason === 'claim' || $formData.reason === 'suggest'}
					<Form.Field {form} name="record">
						<Form.Control let:attrs>
							<Form.Label>{$t('common.contact.record')}</Form.Label>
							<Combobox
								items={congregations}
								{attrs}
								bind:value={congregation}
								placeholder={$t('common.selectThing', {
									thing: $t('congregation.congregation').toLowerCase()
								})}
								disabled={$formData.reason !== 'suggest' && $formData.reason !== 'claim'}
								on:change={(e) => {
									log.debug(e.detail);
									$formData.record = e.detail.value;
								}}
							/>
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/if}

				<Form.Field {form} name="message">
					<Form.Control let:attrs>
						<Form.Label>{$t('common.contact.message')}</Form.Label>
						<Form.Description class="text-red-500">
							{#if $formData.reason === 'delete'}
								{$t('common.contact.account')}
							{:else if $formData.reason === 'claim'}
								{$t('common.contact.proof')}
							{/if}
						</Form.Description>
						<Textarea {...attrs} bind:value={$formData.message} rows={8} required />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="captcha">
					<Form.Control>
						<div id="captcha" class="w-full pt-3"></div>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button>{$t('common.contact.send')}</Form.Button>
			</form>

			{#if dev}
				{#await import('sveltekit-superforms') then { default: SuperDebug }}
					<div class="mt-4"><SuperDebug data={$formData} /></div>
				{/await}
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
