<script lang="ts">
	/* region imports */
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import Loading from '$lib/components/global/loading.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Form from '$lib/components/ui/form';
	import { m } from '$lib/paraglide/messages';
	import { state as appState, setState } from '$lib/stores';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	const { data, id }: { data: SuperValidated<any>; id: string } = $props();
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		dataType: 'json',
		id: 'deleteCongregation',
		onError({ result }) {
			log.error(result.error.message);
			toast.error(result.error.message);
		},
		onResult() {
			setState({ loading: false });
		},
		onSubmit() {
			setState({ loading: true });
		},
		async onUpdate({ result }) {
			if (result.type === 'success') {
				toast.success(m.deleteSuccess());
				await goto('/');
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form_errors);
				if (!isEmpty(result.data.form.errors)) toast.error(m.deleteFailure());
			}
		}
	});

	const { enhance, form: formData } = form;
	/* endregion form */

	/* region lifecycle */
	onMount(() => {
		$formData.id = id;
	});
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger
		class="button border border-red-300 bg-white text-red-500 hover:bg-red-50 hover:text-red-600"
		type="button"
	>
		{m.delete()}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		{#if $appState.loading}
			<div
				transition:fade={{ delay: 300, duration: 100 }}
				class="flex h-full min-h-96 w-full flex-col items-center justify-center"
			>
				<Loading />
			</div>
		{:else}
			<form
				id="delete"
				method="POST"
				action="?/delete"
				use:enhance
				transition:fade={{ delay: 300, duration: 100 }}
			>
				<AlertDialog.Header>
					<AlertDialog.Title>{m.warning()}</AlertDialog.Title>
					<AlertDialog.Description>
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
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
					<AlertDialog.Action
						type="submit"
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							const formEl = document.getElementById('delete');
							if (form) form.submit(formEl);
						}}
					>
						{m.continue()}
					</AlertDialog.Action>
				</AlertDialog.Footer>
			</form>
		{/if}
		{#if dev}
			{#await import('sveltekit-superforms') then { default: SuperDebug }}
				<div class="mt-4"><SuperDebug data={$formData} collapsible collapsed /></div>
			{/await}
		{/if}
	</AlertDialog.Content>
</AlertDialog.Root>
