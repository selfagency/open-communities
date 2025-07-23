<script lang="ts">
	/* region imports */
	import * as Accordion from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as m from '$lib/paraglide/messages';
	/* endregion imports */

	let { errors, form, formData, view = $bindable() } = $props();
</script>

<!-- accessibility -->
{#if $formData.accessibility}
	<Accordion.Item value="accessibility">
		<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
			<div
				class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
			>
				<span>{m['accessibility.accessibility']()}</span>
				{#if $errors.accessibility}
					<span class="text-red-500">*</span>
				{/if}
			</div>
		</Accordion.Trigger>
		<Accordion.Content>
			<div class="question">{m['accessibility.extended']()}</div>
			<div class="mt-2 text-slate-500 italic">
				{m['accessibility.note']()}
			</div>
			<div class="my-4 space-y-2">
				<Form.Field {form} name="online_asl">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox {...props} bind:checked={$formData.accessibility.online_asl} />
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m['accessibility.online_asl']()}</Form.Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="online_liveCaptions">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox {...props} bind:checked={$formData.accessibility.online_liveCaptions} />
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m['accessibility.online_liveCaptions']()}</Form.Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="online_automatedCaptions">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox
										{...props}
										bind:checked={$formData.accessibility.online_automatedCaptions}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>
										{m['accessibility.online_automatedCaptions']()}
									</Form.Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="inPerson_adaAll">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox {...props} bind:checked={$formData.accessibility.inPerson_adaAll} />
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m['accessibility.inPerson_adaAll']()}</Form.Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="inPerson_adaSome">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox {...props} bind:checked={$formData.accessibility.inPerson_adaSome} />
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m['accessibility.inPerson_adaSome']()}</Form.Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="inPerson_asl">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox {...props} bind:checked={$formData.accessibility.inPerson_asl} />
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m['accessibility.inPerson_asl']()}</Form.Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="inPerson_eva">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox {...props} bind:checked={$formData.accessibility.inPerson_eva} />
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m['accessibility.inPerson_eva']()}</Form.Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="accoms_other">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox {...props} bind:checked={$formData.accessibility.other} />
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.other()}</Form.Label>
								</span>
							</span>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				{#if $formData.accessibility.other}
					<Form.Field {form} name="accoms_otherText">
						<Form.Control
							>{#snippet children(props)}
								<Input {...props} bind:value={$formData.accessibility.otherText} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/if}
			</div>

			<div class="mt-4 flex flex-row items-center justify-end">
				<Button variant="secondary" onclick={() => (view = 'health')}>{m.next()} →</Button>
			</div>
		</Accordion.Content>
	</Accordion.Item>
{/if}
