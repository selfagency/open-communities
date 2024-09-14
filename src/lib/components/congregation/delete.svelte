<script lang="ts">
	/* region imports */
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { joi } from 'sveltekit-superforms/adapters';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { t } from '$lib/i18n';
	import { deleteSchema } from '$lib/schemas';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	export let id: string;
	/* endregion variables */

	/* region methods */
	function deleteCongregation(e) {
		e.preventDefault();
		e.stopPropagation();
		const formEl = document.getElementById('delete');
		if (form) form.submit(formEl);
	}
	/* endregion methods */

	/* region form */
	const form = superForm(data, {
		id: 'deleteCongregation',
		dataType: 'json',
		validators: joi(deleteSchema),
		async onUpdate({ result }) {
			if (!isEmpty(result.data.form.errors)) {
				log.error(JSON.stringify(result.data.form.errors));
				if (result.data.form.errors.error) {
					toast.error($t('congregation.deleteFailure'));
				}
			} else if (result.type === 'success') {
				toast.success($t('congregation.deleteSuccess'));
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

	/* region lifecycle */
	onMount(() => {
		$formData.id = id;
	});
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger>
		<Button
			class="border border-red-300 bg-white text-red-500 hover:bg-red-50 hover:text-red-600"
			on:click={(e) => {
				e.preventDefault();
			}}
		>
			{$t('common.delete')}
		</Button>
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<form id="delete" method="POST" action="?/delete" use:enhance>
			<AlertDialog.Header>
				<AlertDialog.Title>{$t('common.warning')}</AlertDialog.Title>
				<AlertDialog.Description>
					<Alert.Root variant="destructive" class="my-4 bg-red-50">
						<WarningIcon size="18" />
						<Alert.Description class="mt-0.5">{$t('common.warningNote')}</Alert.Description>
					</Alert.Root>

					<Form.Field {form} name="id">
						<Form.Control let:attrs>
							<input type="hidden" {...attrs} bind:value={$formData.id} />
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>{$t('common.cancel')}</AlertDialog.Cancel>
				<AlertDialog.Action on:click={deleteCongregation}>
					{$t('common.continue')}
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
