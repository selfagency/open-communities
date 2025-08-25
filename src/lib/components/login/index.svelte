<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Loading from '$lib/components/global/loading.svelte';
	import Reset from '$lib/components/login/reset.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	import { state as appState, setState } from '$lib/stores';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	const { data, reset }: { data: SuperValidated<any>; reset: SuperValidated<any> } = $props();

	// locals
	let resetting: boolean = $state(false);
	let resetSuccess: boolean = $state(false);
	let sentSuccess: boolean = $state(false);
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
		dataType: 'json',
		id: 'login',
		onError({ result }) {
			log.error(result.error.message);
			toast.error(result.error.message);
		},
		onResult() {
			setState({ loadingSecondary: false });
		},
		onSubmit() {
			setState({ loadingSecondary: true });
		},
		async onUpdate({ result }) {
			setState({ loadingSecondary: false });
			if (result.type === 'success') {
				toast.success(m.loginSuccess());
				await goto('/');
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.errors))
					log.error('submission error', result.data.form.errors);
				toast.error(result.data.form.errors);
			}
		}
	});

	const { enhance, form: formData } = form;
	/* endregion form */
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="font-display text-2xl font-normal">
			<span>{resetting ? m.resetPassword() : m.login()}</span>
		</Card.Title>
		<!-- <Card.Description></Card.Description> -->
	</Card.Header>
	<Card.Content>
		{#if $appState.loading || $appState.loadingSecondary}
			<div
				transition:fade={{ delay: 300, duration: 100 }}
				class="flex h-full min-h-96 w-full flex-col items-center justify-center"
			>
				<Loading />
			</div>
		{:else if resetting}
			{#if !sentSuccess && !resetSuccess}
				<Reset
					data={reset}
					token={page.url.searchParams.get('resetPassword')}
					bind:reset={resetSuccess}
					bind:sent={sentSuccess}
				/>
			{/if}
			{#if sentSuccess && !resetSuccess}
				<div class="flex flex-col items-center justify-center space-y-4">
					<span>{m.emailSent()}</span>
				</div>
			{/if}
			{#if resetSuccess}
				<div class="flex flex-col items-center justify-center space-y-4">
					<span>{m.passwordSuccess()}</span>
					<span role="button" tabindex="0" onclick={() => resetter()} onkeypress={() => resetter()}>
						{m.continueToLogin} →
					</span>
				</div>
			{/if}
		{:else}
			<form method="POST" action="?/login" use:enhance class="space-y-2">
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
								autocomplete="current-password"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="mt-4">
					<Form.Button>{m.login()}</Form.Button>
					<Button variant="link" onclick={() => (resetting = true)}>{m.forgotPassword()}</Button>
				</div>
			</form>
		{/if}

		{#if dev}
			{#await import('sveltekit-superforms') then { default: SuperDebug }}
				<div class="mt-4"><SuperDebug data={$formData} /></div>
			{/await}
		{/if}
	</Card.Content>
	<!-- <Card.Footer></Card.Footer> -->
</Card.Root>
