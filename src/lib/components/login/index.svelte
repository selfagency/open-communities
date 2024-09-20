<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Reset from '$lib/components/login/reset.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	export let reset: SuperValidated<any>;

	// local vars
	let resetting: boolean = false;
	let resetSuccess: boolean = false;
	let sentSuccess: boolean = false;
	/* endregion variables */

	/* region methods */
	const resetter = () => {
		resetting = false;
		resetSuccess = false;
		sentSuccess = false;
	};
	/* endregion methods */

	/* region form */
	const form = superForm(data, {
		id: 'login',
		dataType: 'json',
		async onUpdate({ result }) {
			if (result.type === 'success') {
				toast.success($t('auth.loginSuccess'));
				user.set(result.data.user);
				await goto('/');
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.error)) log.error('submission error', result.data.form.error);
				toast.error(result.data.form.error);
			}
		},
		onError({ result }) {
			log.error(result.error.message);
			toast.error(result.error.message);
		}
	});

	const { form: formData, enhance } = form;
	/* endregion form */
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="font-display text-2xl">
			<span>{resetting ? $t('auth.resetPassword') : $t('auth.login')}</span>
		</Card.Title>
		<!-- <Card.Description></Card.Description> -->
	</Card.Header>
	<Card.Content>
		{#if resetting}
			{#if !sentSuccess && !resetSuccess}
				<Reset
					data={reset}
					token={$page.url.searchParams.get('resetPassword')}
					bind:reset={resetSuccess}
					bind:sent={sentSuccess}
				/>
			{/if}
			{#if sentSuccess && !resetSuccess}
				<div class="flex flex-col items-center justify-center space-y-4">
					<span>{$t('auth.emailSent')}</span>
				</div>
			{/if}
			{#if resetSuccess}
				<div class="flex flex-col items-center justify-center space-y-4">
					<span>{$t('auth.passwordSuccess')}</span>
					<span
						role="button"
						tabindex="0"
						on:click={() => resetter()}
						on:keypress={() => resetter()}
					>
						{$t('auth.continueToLogin')} →
					</span>
				</div>
			{/if}
		{:else}
			<form method="POST" action="?/login" use:enhance class="space-y-2">
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

				<Form.Button>{$t('auth.login')}</Form.Button>
				<Button variant="link" on:click={() => (resetting = true)}
					>{$t('auth.forgotPassword')}</Button
				>
			</form>

			{#if dev}
				{#await import('sveltekit-superforms') then { default: SuperDebug }}
					<div class="mt-4"><SuperDebug data={$formData} /></div>
				{/await}
			{/if}
		{/if}
	</Card.Content>
	<!-- <Card.Footer></Card.Footer> -->
</Card.Root>
