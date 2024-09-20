<script lang="ts">
	import { isEmpty } from 'radashi';
	/* region imports */
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { waitForTheElement } from 'wait-for-the-element';

	import { dev } from '$app/environment';
	import { t } from '$lib/i18n';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	export let token: string | null;
	export let verified: boolean = false;

	// local vars
	let error: string;
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		id: 'verify',
		dataType: 'json',
		async onUpdate({ result }) {
			if (result.type === 'success') {
				verified = true;
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.error)) log.error('submission error', result.data.form.error);
				toast.error($t('auth.verifyFailure'));
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
		$formData.token = token;
		$formData.type = 'verifyEmail';
		await waitForTheElement('#verify', { timeout: 1000 });
		const formEl = document.getElementById('verify') as HTMLFormElement;
		form.submit(formEl);
	});
	/* endregion lifecycle */
</script>

<div
	in:fade={{ delay: 200, duration: 100 }}
	out:fade={{ duration: 100, delay: 0 }}
	class="space-y-4"
>
	{#if error}
		<div>{error}</div>
	{:else}
		<div>{$t('auth.verifying')}</div>
	{/if}

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
