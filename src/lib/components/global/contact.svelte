<script lang="ts">
	/* region imports */
	import { sleep } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';

	import { browser, dev } from '$app/environment';
	import { page } from '$app/state';
	import { PUBLIC_PROSOPO_SITE_KEY } from '$env/static/public';
	import Combobox from '$lib/components/global/combobox.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as m from '$lib/paraglide/messages';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	let {
		congregations,
		data,
		snapshot = $bindable()
	}: { congregations: any; data: any; snapshot: any } = $props();

	// derived
	const user = $derived(page.data.user);

	// locals
	let success: boolean = $state(false);
	let congregation: string = $state('');
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		dataType: 'json',
		id: 'signup',
		onError({ result }) {
			log.error('submission error', result.error.message);
			toast.error(result.error.message);
		},
		async onUpdate({ form: f, result }) {
			if (!f.valid || result.type !== 'success') {
				log.error('form error', result.data.form.errors);
				if (result.data.form.error) {
					log.error('submission error', result.data.form.error);
					toast.error(m.emailFailure);
				}
			} else if (result.type === 'success') {
				toast.success(m.emailSuccess);
				success = true;
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
			window['procaptcha']?.render(captchaContainer, {
				callback: (token) => {
					$formData.captcha = token;
				},
				captchaType: 'frictionless',
				siteKey: PUBLIC_PROSOPO_SITE_KEY,
				theme: 'light'
			});
		}

		if (!$formData.reason) $formData.reason = 'question';
		if (!$formData.name) $formData.name = user?.name || '';
		if (!$formData.email) $formData.email = user?.email || '';
		if (!$formData.record) $formData.record = '';
		if (!$formData.message) $formData.message = '';
		if (!$formData.captcha) $formData.captcha = '';
	});
	/* endregion lifecycle */

	/* region reactivity */
	$effect(() => {
		if (page.url.searchParams.has('claim')) {
			$formData.reason = 'claim';
			congregation = page.url.searchParams.get('claim') as string;
			$formData.record = congregation;
		}
	});
	/* endregion reactivity */
</script>

<Card.Root class="mx-auto w-full max-w-md">
	<Card.Header>
		<Card.Title class="font-display text-2xl font-normal">
			{m['contact.contactUs']()}
		</Card.Title>
		<!-- <Card.Description></Card.Description> -->
	</Card.Header>
	<Card.Content>
		{#if success}
			<span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
				{m.emailSuccessNotice()}
			</span>
		{:else}
			<form
				method="POST"
				use:enhance
				class="space-y-2"
				in:fade={{ delay: 200, duration: 100 }}
				out:fade={{ delay: 0, duration: 100 }}
			>
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m.name()}</Form.Label>
							<Input {...props} bind:value={$formData.name} required />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m.email()}</Form.Label>
							<Input {...props} bind:value={$formData.email} required />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="reason">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m['contact.reason']()}</Form.Label>
							<Select.Root type="single" bind:value={$formData.reason}>
								<Select.Trigger class="w-full">
									{m[`contactOptions.${$formData.reason}`]()}
								</Select.Trigger>
								<Select.Content {...props}>
									<Select.Item value="question">{m['contactOptions.question']()}</Select.Item>
									<Select.Item value="suggest">{m['contactOptions.suggest']()}</Select.Item>
									<Select.Item value="claim">{m['contactOptions.claim']()}</Select.Item>
									<Select.Item value="delete">{m['contactOptions.delete']()}</Select.Item>
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				{#if $formData.reason === 'claim' || $formData.reason === 'suggest'}
					<Form.Field {form} name="record">
						<Form.Control>
							{#snippet children(props)}
								<Form.Label>{m['contact.record']()}</Form.Label>
								<Combobox
									items={congregations}
									{...props}
									bind:value={congregation}
									placeholder={m.selectThing({
										thing: m.congregation().toLowerCase()
									})}
									disabled={$formData.reason !== 'suggest' && $formData.reason !== 'claim'}
									on:change={(e) => {
										// log.debug(e.detail);
										$formData.record = e.detail.value;
									}}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/if}

				<Form.Field {form} name="message">
					<Form.Control>
						{#snippet children(props)}
							<Form.Label>{m['contact.message']()}</Form.Label>
							<Form.Description class="text-red-500">
								{#if $formData.reason === 'delete'}
									{m['contact.account']()}
								{:else if $formData.reason === 'claim'}
									{m['contact.proof']()}
								{/if}
							</Form.Description>
							<Textarea {...props} bind:value={$formData.message} rows={8} required />
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

				<Form.Button>{m['contact.send']()}</Form.Button>
			</form>

			{#if dev}
				{#await import('sveltekit-superforms') then { default: SuperDebug }}
					<div class="mt-4"><SuperDebug data={$formData} /></div>
				{/await}
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
