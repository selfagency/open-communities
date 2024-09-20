<script lang="ts">
	/* region imports */
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Alert from '$lib/components/ui/alert';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	export let id: string;
	export let owner: string | undefined = undefined;

	// local vars
	let open: boolean = false;
	/* endregion variables */

	/* region form */
	const form = superForm(data, {
		id: 'transferCongregation',
		dataType: 'json',
		async onUpdate({ result }) {
			log.debug('result', result.type);
			if (result.type === 'success') {
				open = false;
				toast.success($t('congregation.transferSuccess'));
				await goto('/');
			} else {
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.error)) log.error('submission error', result.data.form.error);
				toast.error($t('congregation.transferFailure'));
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
		$formData.owner = owner;
		$formData.email = $page.url.searchParams.get('transfer');
	});
	/* endregion lifecycle */

	/* region reactivity */
	$: if ($page.url.searchParams.has('transfer')) {
		open = true;
	}
</script>

{#if $user.admin}
	<AlertDialog.Root bind:open>
		<AlertDialog.Trigger>
			<Button
				class="border border-red-300 bg-white text-red-500 hover:bg-red-50 hover:text-red-600"
				on:click={(e) => {
					e.preventDefault();
				}}
			>
				{$t('common.transfer.transfer')}
			</Button>
		</AlertDialog.Trigger>
		<AlertDialog.Content>
			<form id="transfer" method="POST" action="?/transfer" use:enhance>
				<AlertDialog.Header>
					<AlertDialog.Title>{$t('common.transfer.transfer')}</AlertDialog.Title>
					<AlertDialog.Description class="space-y-4">
						<div>{$t('common.transfer.desc')}</div>

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

						<Form.Field {form} name="email">
							<Form.Control let:attrs>
								<Form.Label for="email">{$t('common.email')}</Form.Label>
								<Input {...attrs} bind:value={$formData.email} />
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer class="mt-4">
					<AlertDialog.Cancel
						on:click={async () => {
							open = false;
							await goto(`${$page.url.pathname}?id=${id}`);
						}}>{$t('common.cancel')}</AlertDialog.Cancel
					>
					<AlertDialog.Action
						on:click={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.submit(document.getElementById('transfer'));
						}}
					>
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
{/if}
