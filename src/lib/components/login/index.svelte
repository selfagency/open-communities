<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { joi } from 'sveltekit-superforms/adapters';

	import { goto } from '$app/navigation';
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
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		id: 'login',
		dataType: 'json',
		validators: joi(loginSchema),
		async onUpdate({ result }) {
			if (!isEmpty(result.data.form.errors)) {
				log.error(JSON.stringify(result.data.form.errors));
				if (result.data.form.errors.error) {
					toast.error(result.data.form.errors.error);
				}
			} else if (result.type === 'success') {
				log.debug(JSON.stringify(result.data.user));
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
		<Card.Title>{$t('base.auth.login')}</Card.Title>
		<!-- <Card.Description></Card.Description> -->
	</Card.Header>
	<Card.Content>
		<form method="POST" action="?/login" use:enhance class="space-y-2">
			<Form.Field {form} name="email">
				<Form.Control let:attrs>
					<Form.Label>{$t('base.auth.email')}</Form.Label>
					<Input {...attrs} bind:value={$formData.email} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="password">
				<Form.Control let:attrs>
					<Form.Label>{$t('base.auth.password')}</Form.Label>
					<Input {...attrs} bind:value={$formData.password} type="password" />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button>{$t('base.auth.login')}</Form.Button>
		</form>
	</Card.Content>
	<!-- <Card.Footer></Card.Footer> -->
</Card.Root>
