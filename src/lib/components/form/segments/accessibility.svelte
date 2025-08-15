<script lang="ts">
	/* region imports */
	import * as Accordion from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
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
				<span>{m.accessibility()}</span>
				{#if $errors.accessibility}
					<span class="text-red-500">*</span>
				{/if}
			</div>
		</Accordion.Trigger>
		<Accordion.Content>
			<div class="question">{m.accessibility_extended()}</div>
			<div class="mt-2 text-slate-500 italic">
				{m.accessibility_note()}
			</div>
			<div class="my-4 space-y-2">
				<Form.Field {form} name="online_asl">
					<Form.Control
						>{#snippet children(props)}
							<span class="flex flex-row items-start justify-start space-x-2">
								<span>
									<Checkbox
										{...props}
										checked={$formData.accessibility.online_asl}
										onCheckedChange={(checked) => {
											$formData.accessibility.online_asl = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.accessibility_online_asl()}</Form.Label>
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
									<Checkbox
										{...props}
										checked={$formData.accessibility.online_liveCaptions}
										onCheckedChange={(checked) => {
											$formData.accessibility.online_liveCaptions = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.accessibility_online_liveCaptions()}</Form.Label>
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
										checked={$formData.accessibility.online_automatedCaptions}
										onCheckedChange={(checked) => {
											$formData.accessibility.online_automatedCaptions = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>
										{m.accessibility_online_automatedCaptions()}
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
									<Checkbox
										{...props}
										checked={$formData.accessibility.inPerson_adaAll}
										onCheckedChange={(checked) => {
											$formData.accessibility.inPerson_adaAll = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.accessibility_inPerson_adaAll()}</Form.Label>
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
									<Checkbox
										{...props}
										checked={$formData.accessibility.inPerson_adaSome}
										onCheckedChange={(checked) => {
											$formData.accessibility.inPerson_adaSome = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.accessibility_inPerson_adaSome()}</Form.Label>
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
									<Checkbox
										{...props}
										checked={$formData.accessibility.inPerson_asl}
										onCheckedChange={(checked) => {
											$formData.accessibility.inPerson_asl = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.accessibility_inPerson_asl()}</Form.Label>
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
									<Checkbox
										{...props}
										checked={$formData.accessibility.inPerson_eva}
										onCheckedChange={(checked) => {
											$formData.accessibility.inPerson_eva = checked ?? false;
										}}
									/>
								</span>
								<span class="-mt-0.5">
									<Form.Label>{m.accessibility_inPerson_eva()}</Form.Label>
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
									<Checkbox
										{...props}
										checked={$formData.accessibility.other}
										onCheckedChange={(checked) => {
											$formData.accessibility.other = checked ?? false;
										}}
									/>
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
