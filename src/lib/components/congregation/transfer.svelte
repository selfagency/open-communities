<script lang="ts">
	/* region imports */
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import { isEmpty } from 'radashi';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import { joi } from 'sveltekit-superforms/adapters';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { t } from '$lib/i18n';
	import { transferSchema } from '$lib/schemas';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	export let id: string;

	// local vars
	let transferring: boolean = false;
	let transferEmail: string = '';
	/* endregion variables */

	/* region methods */
	async function transferCongregation(e) {
		try {
			e.preventDefault();
			const body = new FormData();
			body.append('id', id);
			body.append('email', transferEmail);
			const res = await fetch('?/transfer', {
				method: 'POST',
				body
			});
			if (res.status === 200) {
				await goto('/');
			} else {
				throw new Error($t('base.congregation.transferFailure'));
			}
		} catch (error) {
			log.error(error);
			toast.error((error as Error).message);
		}
	}
	/* endregion methods */

	/* region form */
	const form = superForm(data, {
		id: 'transferCongregation',
		dataType: 'json',
		validators: joi(transferSchema),
		async onUpdate({ result }) {
			if (!isEmpty(result.data.form.errors)) {
				log.error(JSON.stringify(result.data.form.errors));
				if (result.data.form.errors.error) {
					toast.error(result.data.form.errors.error);
				}
			} else if (result.type === 'success') {
				log.debug(JSON.stringify(result.data.user));
				toast.success($t('base.congregation.transferSuccess'));
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

<AlertDialog.Root>
	<AlertDialog.Trigger>
		<Button
			class="border border-red-300 bg-white text-red-500 hover:bg-red-50 hover:text-red-600"
			on:click={(e) => {
				e.preventDefault();
			}}
		>
			{$t('base.common.transfer.transfer')}
		</Button>
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<form method="POST" action="?/transfer" use:enhance>
			<AlertDialog.Header>
				<AlertDialog.Title>{$t('base.common.transfer.transfer')}</AlertDialog.Title>
				<AlertDialog.Description class="space-y-4">
					<div>{$t('base.common.transfer.desc')}</div>

					<Alert.Root variant="destructive" class="my-4 bg-red-50">
						<WarningIcon size="18" />
						<Alert.Description class="mt-0.5">{$t('base.common.warningNote')}</Alert.Description>
					</Alert.Root>

					<div class="space-y-2">
						<Label for="email">{$t('base.common.email')}</Label>
						<Input name="email" bind:value={$formData.email} />
					</div>
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer class="mt-4">
				<AlertDialog.Cancel>{$t('base.common.cancel')}</AlertDialog.Cancel>
				<AlertDialog.Action>
					{$t('base.common.continue')}
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
