<script lang="ts">
	/* region imports */
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Alert from '$lib/components/ui/alert';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	const {
		data,
		id,
		owner
	}: {
		data: SuperValidated<any>;
		id: string;
		owner?: string;
	} = $props();

	// derived
	const user = $derived(page.data.user);

	// locals
	let open: boolean = $derived(page.url.searchParams.has('transfer'));
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		dataType: 'json',
		id: 'transferCongregation',
		onError({ result }) {
			log.error(result.error.message);
			toast.error(result.error.message);
		},
		async onUpdate({ result }) {
			// log.debug('result', result.type);
			if (result.type === 'success') {
				open = false;
				toast.success(m.transferSuccess());
				await goto('/');
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form_errors);
				if (!isEmpty(result.data.form.errors))
					log.error('submission error', result.data.form_error);
				toast.error(m.transferFailure());
			}
		}
	});

	const { enhance, form: formData } = form;
	/* endregion form */

	/* region lifecycle */
	onMount(() => {
		formData.set({
			email: page.url.searchParams.get('transfer'),
			id,
			owner
		});
	});
	/* endregion lifecycle */
</script>

{#if user?.admin}
	<AlertDialog.Root bind:open>
		<AlertDialog.Trigger
			class="button border border-red-300 bg-white text-red-500 hover:bg-red-50 hover:text-red-600"
			onclick={(e: Event) => {
				e.preventDefault();
			}}
		>
			{m.transfer()}
		</AlertDialog.Trigger>
		<AlertDialog.Content>
			<form id="transfer" method="POST" action="?/transfer" use:enhance>
				<AlertDialog.Header>
					<AlertDialog.Title>{m.transfer()}</AlertDialog.Title>
					<AlertDialog.Description class="space-y-4">
						<div>{m.transfer_desc()}</div>

						<Alert.Root variant="destructive" class="my-4 bg-red-50">
							<WarningIcon size="18" />
							<Alert.Description class="mt-0.5">{m.warningNote()}</Alert.Description>
						</Alert.Root>

						<Form.Field {form} name="id">
							<Form.Control>
								{#snippet children(props)}
									<input type="hidden" {...props} bind:value={$formData.id} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="email">
							<Form.Control>
								{#snippet children(props)}
									<Form.Label for="email">{m.email()}</Form.Label>
									<Input {...props} bind:value={$formData.email} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer class="mt-4">
					<AlertDialog.Cancel
						onclick={async () => {
							open = false;
							await goto(`${page.url.pathname}?id=${id}`);
						}}>{m.cancel()}</AlertDialog.Cancel
					>
					<AlertDialog.Action
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.submit(document.getElementById('transfer'));
						}}
					>
						{m.continue()}
					</AlertDialog.Action>
				</AlertDialog.Footer>
			</form>

			{#if dev}
				{#await import('sveltekit-superforms') then { default: SuperDebug }}
					<div class="mt-4"><SuperDebug data={$formData} /></div>
				{/await}
			{/if}
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
