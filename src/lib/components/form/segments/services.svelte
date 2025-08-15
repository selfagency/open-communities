<script lang="ts">
	/* region imports */
	import * as Accordion from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	import { valueSet } from '$lib/utils';

	import Required from '../required.svelte';
	/* endregion imports */

	/* region variables */
	// props
	let { errors, form, formData, loading = $bindable(), view = $bindable() } = $props();

	// constants
	const hasServices: boolean = $derived(valueSet($formData.services));

	/* region methods */
	const fixType = (input: any) => {
		return input as Record<string, unknown> & { _errors?: string[] | undefined };
	};
	/* endregion methods */
</script>

<!-- services -->
{#if $formData.services}
	{@const servicesErrors = fixType($errors.services)?._errors}
	<Accordion.Item value="services">
		<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
			<div
				class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
			>
				<span>{m.services_services()}</span>
				{#if !hasServices || servicesErrors}
					<span class="text-red-500">*</span>
				{/if}
			</div>
		</Accordion.Trigger>
		<Accordion.Content>
			<div class="question" class:error={servicesErrors}>
				{m.services_extended()}
				<Required set={hasServices} />
			</div>
			<div class="my-4 space-y-2">
				<Form.Field {form} name="inPerson">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox
										{...props}
										checked={$formData.services.inPerson}
										onCheckedChange={(checked) => {
											$formData.services.inPerson = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.services.inPerson()}</Form_Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="hybrid">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox
										{...props}
										checked={$formData.services.hybrid}
										onCheckedChange={(checked) => {
											$formData.services.hybrid = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.services.hybrid()}</Form_Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="onlineOnly">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox
										{...props}
										checked={$formData.services.onlineOnly}
										onCheckedChange={(checked) => {
											$formData.services.onlineOnly = checked ?? false;

											// If onlineOnly is checked, set health and security to N/A
											if (checked) {
												$formData.health.protocol = 'other';
												$formData.health.otherText = 'N/A';
												$formData.security.other = true;
												$formData.security.otherText = 'N/A';
											}
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.services.onlineOnly()}</Form_Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="offsite">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox
										{...props}
										checked={$formData.services.offsite}
										onCheckedChange={(checked) => {
											$formData.services.offsite = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.services.offsite()}</Form_Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="services_other">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox
										{...props}
										checked={$formData.services.other}
										onCheckedChange={(checked) => {
											$formData.services.other = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.other()}</Form_Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				{#if $formData.services.other}
					<Form.Field {form} name="services_otherText">
						<Form.Control
							>{#snippet children(props)}
								<Input {...props} bind:value={$formData.services.otherText} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/if}
				{#if servicesErrors}
					<span class="text-xs text-red-500">{m.requiredResponse()}</span>
				{/if}
			</div>
			<div class="mt-4 flex flex-row items-center justify-end">
				<Button variant="secondary" onclick={() => (view = 'accessibility')}>
					{m.next()} →
				</Button>
			</div>
		</Accordion.Content>
	</Accordion.Item>
{/if}
