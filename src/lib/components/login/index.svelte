<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Reset from '$lib/components/login/reset.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { loginSchema } from '$lib/schemas';
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
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		if ($page.url.searchParams.has('verifyEmail')) {
			resetting = true;
		}
	});
	/* endregion lifecycle */

	/* region form */
	const form = superForm(data, {
		id: 'login',
		dataType: 'json',
		validators: zod(loginSchema),
		async onUpdate({ result }) {
			if (!isEmpty(result.data.form.errors)) {
				log.error(JSON.stringify(result.data.form.errors));
				if (result.data.form.errors.error) {
					toast.error(result.data.form.errors.error);
				}
			} else if (result.type === 'success') {
				user.set(result.data.user);
				await goto('/');
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
		{#if resetting && !resetSuccess}
			<Reset
				data={reset}
				token={$page.url.searchParams.get('resetPassword')}
				bind:reset={resetSuccess}
				bind:resetting
			/>
		{:else if resetSuccess}
			<div class="flex flex-col items-center justify-center space-y-4">
				<span>{$t('auth.passwordSuccess')}</span>
				<span
					role="button"
					tabindex="0"
					on:click={() => (resetSuccess = false)}
					on:keypress={() => (resetSuccess = false)}
				>
					{$t('auth.continueToLogin')} →
				</span>
			</div>
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
			</form>
		{/if}
	</Card.Content>
	<!-- <Card.Footer></Card.Footer> -->
</Card.Root>
