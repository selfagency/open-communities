<script lang="ts">
	/* region imports */
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	/* endregion imports */

	/* region variables */
	// props
	let { errors, form, formData, view = $bindable() } = $props();
</script>

<Accordion.Item value="contact">
	<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
		<div
			class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
		>
			<span>{m.contact()}</span>
			{#if $errors.contactName || $errors.contactEmail}
				<span class="text-red-500">*</span>
			{/if}
		</div>
	</Accordion.Trigger>
	<Accordion.Content>
		<div class="question mb-4">{m.contactName_extended()}</div>
		<Form.Field {form} name="contactName">
			<Form.Control
				>{#snippet children(props)}
					<Form.Label for="contactName">
						{m.contactName()}
					</Form.Label>
					<Input {...props} bind:value={$formData.contactName} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<div class="question my-4">{m.contactEmail_extended()}</div>
		<Form.Field {form} name="contactEmail">
			<Form.Control
				>{#snippet children(props)}
					<Form.Label for="contactEmail">
						{m.contactEmail()}
					</Form.Label>
					<Input {...props} bind:value={$formData.contactEmail} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</Accordion.Content>
</Accordion.Item>
