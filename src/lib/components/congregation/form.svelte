<script lang="ts">
	/* region imports */
	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import { onMount, getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';

	import type { LocationRecord, LocationMeta } from '$lib/location';
	import type { PagesRecord, CongregationMetaRecord } from '$lib/types';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Combobox from '$lib/components/ui/combobox/index.svelte';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { t } from '$lib/i18n';
	import { Location } from '$lib/location';
	import { defaultSchema } from '$lib/schemas';
	import { user } from '$lib/stores';
	import { log } from '$lib/utils';

	import Delete from './delete.svelte';
	import Transfer from './transfer.svelte';
	/* endregion imports */

	/* region variables */
	// props
	export let data;
	export let content: PagesRecord | undefined = undefined;
	export let mode: 'add' | 'edit' = 'add';
	export let snapshot: any = {};

	// constants
	const { state: location, setCountry, setState, setCity, load: loadLocation } = new Location();
	const congregation = getContext('congregation');

	// local vars
	let country: string = '';
	let state: string = '';
	let city: string = '';

	let hasErrors: boolean = false;
	let addSuccess: boolean = false;
	let editSuccess: boolean = false;

	let title: string = '';

	let view:
		| 'congregation'
		| 'fit'
		| 'services'
		| 'accessibility'
		| 'health'
		| 'security'
		| 'registration'
		| 'contact' = 'congregation';
	/* endregion variables */

	/* region methods */
	function initData() {
		$formData.clergy = '';
		$formData.contactEmail = '';
		$formData.contactName = '';
		$formData.contactUrl = '';
		$formData.flavor = '';
		$formData.name = '';
		$formData.notes = '';
		$formData.visible = false;

		$formData.fit = {
			publicStatement: false,
			clergyMember: false,
			multipleClergyMembers: false,
			other: false,
			otherText: ''
		};

		$formData.location = {
			city: '',
			state: '',
			country: '',
			latitude: 0,
			longitude: 0
		};

		$formData.services = {
			inPerson: false,
			hybrid: false,
			onlineOnly: false,
			offsite: false,
			other: false,
			otherText: ''
		};

		$formData.accessibility = {
			online_asl: false,
			online_liveCaptions: false,
			online_automatedCaptions: false,
			inPerson_adaAll: false,
			inPerson_adaSome: false,
			inPerson_asl: false,
			inPerson_eva: false,
			other: false,
			otherText: ''
		};

		$formData.health = {
			protocol: '',
			otherText: ''
		};

		$formData.security = {
			localPolice: false,
			privateSecurityArmed: false,
			privateSecurityUnarmed: false,
			clergyArmed: false,
			congregantsArmed: false,
			noFirearms: false,
			other: false,
			otherText: ''
		};

		$formData.registration = {
			registrationType: '',
			otherText: '',
			email: '',
			url: ''
		};
	}

	const fixType = (input: any) => {
		return input as { _errors?: string[] | undefined } & Record<string, unknown>;
	};

	const setTitle = () => {
		if (addSuccess || editSuccess) {
			title = $t('common.success', {
				thing:
					mode === 'edit' ? $t('common.edit').toLowerCase() : $t('common.submission').toLowerCase()
			});
		} else {
			title =
				mode === 'edit'
					? $t('common.editThing', { thing: $formData.name })
					: $t('congregation.addCongregation');
		}
	};
	/* endregion methods */

	/* region form */
	const form = superForm(data.default, {
		id: 'addEditCongregation',
		dataType: 'json',
		validators: zod(defaultSchema),
		async onUpdate({ form: f, result }) {
			hasErrors = false;

			if (!f.valid) {
				hasErrors = true;
				log.error(JSON.stringify(result.data.form.errors, null, 2));
				if (result.data.form.errors.error) {
					toast.error(result.data.form.errors.error);
				} else {
					toast.error(
						mode === 'edit' ? $t('congregation.editFailure') : $t('congregation.addFailure')
					);
				}
			} else if (result.type === 'success') {
				toast.success(
					mode === 'edit' ? $t('congregation.editSuccess') : $t('congregation.addSuccess')
				);
				if ($user.admin) {
					await goto('/', { invalidateAll: true });
				} else {
					if (mode === 'add') {
						addSuccess = true;
					} else {
						editSuccess = true;
					}
				}
			}
		},
		onError({ result }) {
			log.error(result.error.message);
			toast.error(result.error.message);
		}
	});

	const { form: formData, errors, enhance, capture, restore } = form;
	snapshot = { capture, restore };
	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		if (!$formData?.id) {
			initData();
		} else {
			const location = (congregation as CongregationMetaRecord).location as LocationMeta;

			city = location.city?.id as string;
			state = location.state?.id as string;
			country = location.country?.id as string;

			await loadLocation({
				city,
				state,
				country
			} as LocationRecord);
		}

		if (!$user.admin) {
			$formData.visible = false;
		}

		setTitle();
	});
	/* endregion lifecycle */

	/* region reactivity */
	$: if ($location.record) {
		$formData.location = {
			country: $location.record.country?.id,
			state: $location.record.state?.id,
			city: $location.record.city?.id
		};
	}

	$: if ($formData.services.onlineOnly) {
		$formData.health.protocol = 'other';
		$formData.health.otherText = 'N/A';
		$formData.security.other = true;
		$formData.security.otherText = 'N/A';
	}

	$: if (addSuccess || editSuccess) setTitle();
	/* endregion reactivity */
</script>

<section class="m-auto w-full" style="max-width: 480px;">
	<Card.Root>
		<form method="POST" action="?/submit" use:enhance>
			<Card.Header>
				<Card.Title class="-mb-4 font-display text-2xl">
					{title}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if mode === 'add' && content}
					<div class="prose">{@html content.content}</div>
				{/if}

				{#if mode === 'edit' && !$user.admin}
					<Alert.Root class="bg-slate-50">
						<WarningIcon size="18" />
						<Alert.Description class="mt-0.5">
							{$t('congregation.editNotice')}
						</Alert.Description>
					</Alert.Root>
				{/if}

				{#if mode === 'add' && addSuccess}
					<p>{$t('congregation.addSuccessNotice')}</p>
				{/if}

				{#if mode === 'edit' && editSuccess}
					<p>{$t('congregation.editSuccessNotice')}</p>
				{/if}

				{#if !addSuccess && !editSuccess}
					{#if hasErrors}
						<span in:fade={{ duration: 150, delay: 300 }} out:fade={{ duration: 150, delay: 150 }}>
							<Alert.Root variant="destructive" class="my-4 bg-red-50">
								<WarningIcon size="18" />
								<Alert.Description class="mt-0.5">{$t('common.formErrors')}</Alert.Description>
							</Alert.Root>
						</span>
					{/if}

					<Accordion.Root value={view}>
						<!-- congregation -->
						<Accordion.Item value="congregation">
							<Accordion.Trigger>
								<span class="font-display text-lg">
									{$t('congregation.congregation')}
									{#if $errors.name || $errors.city || $errors.state || $errors.country || $errors.clergy || $errors.flavor}
										<span class="text-red-500">*</span>
									{/if}
								</span>
							</Accordion.Trigger>
							<Accordion.Content>
								<Form.Field {form} name="name">
									<Form.Control let:attrs>
										<Form.Label>{$t('congregation.name')}</Form.Label>
										<Input {...attrs} bind:value={$formData.name} required />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								{#if $formData.location}
									<Form.Field {form} name="country">
										<Form.Control let:attrs>
											<Form.Label>{$t('congregation.location.country')}</Form.Label>
											<Combobox
												items={$location.options.countryOptions}
												{attrs}
												bind:value={country}
												placeholder={$t('common.selectThing', {
													thing: $t('congregation.location.country').toLowerCase()
												})}
												on:change={async () => await setCountry(country)}
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="state">
										<Form.Control let:attrs>
											<Form.Label>{$t('congregation.location.state')}</Form.Label>
											<Combobox
												items={$location.options.stateOptions}
												{attrs}
												bind:value={state}
												placeholder={$t('common.selectThing', {
													thing: $t('congregation.location.state').toLowerCase()
												})}
												disabled={!country && !$location.options.stateOptions}
												on:change={async () => await setState(state)}
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="city">
										<Form.Control let:attrs>
											<Form.Label>{$t('congregation.location.city')}</Form.Label>
											<Combobox
												items={$location.options.cityOptions}
												{attrs}
												bind:value={city}
												placeholder={$t('common.selectThing', {
													thing: $t('congregation.location.city').toLowerCase()
												})}
												disabled={!state && !$location.options.cityOptions}
												on:change={() => setCity(city)}
											/>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
								{/if}

								<Form.Field {form} name="contactUrl">
									<Form.Control let:attrs>
										<Form.Label>{$t('common.website')}</Form.Label>
										<Input {...attrs} bind:value={$formData.contactUrl} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<Form.Field {form} name="clergy">
									<Form.Control let:attrs>
										<Form.Label>{$t('congregation.clergy.extended')}</Form.Label>
										<Input {...attrs} bind:value={$formData.clergy} required />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<Form.Field {form} name="flavor">
									<Form.Control let:attrs>
										<Form.Label>{$t('congregation.flavor.extended')}</Form.Label>
										<Textarea {...attrs} bind:value={$formData.flavor} required />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<Form.Field {form} name="notes">
									<Form.Control let:attrs>
										<Form.Label>{$t('congregation.notes.extended')}</Form.Label>
										<Textarea {...attrs} bind:value={$formData.notes} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<div class="mt-4 flex flex-row items-center justify-end">
									<Button variant="secondary" on:click={() => (view = 'fit')}
										>{$t('common.next')} →</Button
									>
								</div>
							</Accordion.Content>
						</Accordion.Item>

						<!-- fit -->
						{#if $formData.fit}
							{@const fitErrors = fixType($errors.fit)?._errors}
							<Accordion.Item value="fit">
								<Accordion.Trigger>
									<span class="font-display text-lg">
										{$t('congregation.fit.fit')}
										{#if fitErrors}
											<span class="text-red-500">*</span>
										{/if}
									</span>
								</Accordion.Trigger>
								<Accordion.Content>
									<div class="question" class:error={fitErrors}>
										{$t('congregation.fit.extended')}
									</div>
									<div class="my-4 space-y-2">
										<Form.Field {form} name="publicStatement">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.fit.publicStatement} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.fit.publicStatement')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="clergyMember">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.fit.clergyMember} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.fit.clergyMember')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="multipleClergyMembers">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.fit.multipleClergyMembers}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.fit.multipleClergyMembers')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="fit_other">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.fit.other} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('common.other')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										{#if $formData.fit.other}
											<Form.Field {form} name="fit_otherText">
												<Form.Control let:attrs>
													<Input {...attrs} bind:value={$formData.fit.otherText} />
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										{/if}
										{#if fitErrors}
											<span class="text-xs text-red-500">{$t('common.required')}</span>
										{/if}
									</div>

									<!-- flag -->
									<Form.Field {form} name="flag">
										<Form.Control let:attrs>
											<div class="question my-4 flex flex-col items-start justify-start space-y-2">
												<span>{$t('congregation.fit.flag.extended')}</span>
												<small class="leading-1">{$t('congregation.fit.flag.note')}</small>
											</div>
											<RadioGroup.Root {...attrs} class="space-y-2" bind:value={$formData.fit.flag}>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="no" id="no" />
													<Form.Label for="no">{$t('congregation.fit.flag.no')}</Form.Label>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="yes" id="yes" />
													<Form.Label for="yes">{$t('congregation.fit.flag.yes')}</Form.Label>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="yesBima" id="yesBima" />
													<Form.Label for="yesBima"
														>{$t('congregation.fit.flag.yesBima')}</Form.Label
													>
												</div>
											</RadioGroup.Root>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<div class="mt-4 flex flex-row items-center justify-end">
										<Button variant="secondary" on:click={() => (view = 'services')}
											>{$t('common.next')} →</Button
										>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/if}

						<!-- services -->
						{#if $formData.services}
							{@const servicesErrors = fixType($errors.services)?._errors}
							<Accordion.Item value="services">
								<Accordion.Trigger>
									<span class="font-display text-lg">
										{$t('congregation.services.services')}
										{#if servicesErrors}
											<span class="text-red-500">*</span>
										{/if}
									</span>
								</Accordion.Trigger>
								<Accordion.Content>
									<div class="question" class:error={servicesErrors}>
										{$t('congregation.services.extended')}
									</div>
									<div class="my-4 space-y-2">
										<Form.Field {form} name="inPerson">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.services.inPerson} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.services.inPerson')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="hybrid">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.services.hybrid} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.services.hybrid')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="onlineOnly">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.services.onlineOnly} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.services.onlineOnly')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="offsite">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.services.offsite} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.services.offsite')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="services_other">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.services.other} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('common.other')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										{#if $formData.services.other}
											<Form.Field {form} name="services_otherText">
												<Form.Control let:attrs>
													<Input {...attrs} bind:value={$formData.services.otherText} />
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										{/if}
										{#if servicesErrors}
											<span class="text-xs text-red-500">{$t('common.required')}</span>
										{/if}
									</div>
									<div class="mt-4 flex flex-row items-center justify-end">
										<Button variant="secondary" on:click={() => (view = 'accessibility')}>
											{$t('common.next')} →
										</Button>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/if}

						<!-- accessibility -->
						{#if $formData.accessibility}
							<Accordion.Item value="accessibility">
								<Accordion.Trigger>
									<span class="font-display text-lg">
										{$t('congregation.accessibility.accessibility')}
										{#if $errors.accessibility}
											<span class="text-red-500">*</span>
										{/if}
									</span>
								</Accordion.Trigger>
								<Accordion.Content>
									<div class="question">{$t('congregation.accessibility.extended')}</div>
									<div class="mt-2 italic text-slate-500">
										{$t('congregation.accessibility.note')}
									</div>
									<div class="my-4 space-y-2">
										<Form.Field {form} name="online_asl">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.accessibility.online_asl}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.accessibility.online_asl')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="online_liveCaptions">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.accessibility.online_liveCaptions}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label
															>{$t('congregation.accessibility.online_liveCaptions')}</Form.Label
														>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="online_automatedCaptions">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.accessibility.online_automatedCaptions}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label>
															{$t('congregation.accessibility.online_automatedCaptions')}
														</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="inPerson_adaAll">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.accessibility.inPerson_adaAll}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label
															>{$t('congregation.accessibility.inPerson_adaAll')}</Form.Label
														>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="inPerson_adaSome">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.accessibility.inPerson_adaSome}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label
															>{$t('congregation.accessibility.inPerson_adaSome')}</Form.Label
														>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="inPerson_asl">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.accessibility.inPerson_asl}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.accessibility.inPerson_asl')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="inPerson_eva">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.accessibility.inPerson_eva}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.accessibility.inPerson_eva')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="accoms_other">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.accessibility.other} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('common.other')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										{#if $formData.accessibility.other}
											<Form.Field {form} name="accoms_otherText">
												<Form.Control let:attrs>
													<Input {...attrs} bind:value={$formData.accessibility.otherText} />
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										{/if}
									</div>

									<div class="mt-4 flex flex-row items-center justify-end">
										<Button variant="secondary" on:click={() => (view = 'health')}
											>{$t('common.next')} →</Button
										>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/if}

						<!-- health -->
						{#if $formData.health}
							{@const healthErrors = fixType($errors.health)}
							<Accordion.Item value="health">
								<Accordion.Trigger>
									<span class="font-display text-lg">
										{$t('congregation.health.health')}
										{#if healthErrors}
											<span class="text-red-500">*</span>
										{/if}
									</span>
								</Accordion.Trigger>
								<Accordion.Content>
									<Form.Field {form} name="protocol">
										<Form.Control let:attrs>
											<div class="question mb-4" class:error={healthErrors?.protocol}>
												{$t('congregation.health.extended')}
											</div>
											<RadioGroup.Root
												{...attrs}
												class="space-y-2"
												bind:value={$formData.health.protocol}
												required
											>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="maskingRequired" id="maskingRequired" />
													<Form.Label for="maskingRequired"
														>{$t('congregation.health.maskingRequired')}</Form.Label
													>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="maskingRecommended" id="maskingRecommended" />
													<Form.Label for="maskingRecommended"
														>{$t('congregation.health.maskingRecommended')}</Form.Label
													>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="noGuidelines" id="noGuidelines" />
													<Form.Label for="noGuidelines"
														>{$t('congregation.health.noGuidelines')}</Form.Label
													>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="other" id="other" />
													<Form.Label for="other">{$t('common.other')}</Form.Label>
												</div>
											</RadioGroup.Root>
											{#if $formData.health.protocol === 'other'}
												<Form.Field {form} name="health_otherText">
													<Form.Control let:attrs>
														<Input {...attrs} bind:value={$formData.health.otherText} />
													</Form.Control>
													<Form.FieldErrors />
												</Form.Field>
											{/if}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									{#if healthErrors?.protocol}
										<span class="mt-4 block text-xs text-red-500">{$t('common.required')}</span>
									{/if}
									<div class="mt-4 flex flex-row items-center justify-end">
										<Button variant="secondary" on:click={() => (view = 'security')}>
											{$t('common.next')} →
										</Button>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/if}

						<!-- security -->
						{#if $formData.security}
							{@const securityErrors = fixType($errors.security)?._errors}
							<Accordion.Item value="security">
								<Accordion.Trigger>
									<span class="font-display text-lg">
										{$t('congregation.security.security')}
										{#if securityErrors}
											<span class="text-red-500">*</span>
										{/if}
									</span>
								</Accordion.Trigger>
								<Accordion.Content>
									<div class="question" class:error={securityErrors}>
										{$t('congregation.security.extended')}
									</div>
									<div class="my-4 space-y-2">
										<Form.Field {form} name="localPolice">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.security.localPolice} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.security.localPolice')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="privateSecurityArmed">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.security.privateSecurityArmed}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label
															>{$t('congregation.security.privateSecurityArmed')}</Form.Label
														>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="privateSecurityUnarmed">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.security.privateSecurityUnarmed}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label
															>{$t('congregation.security.privateSecurityUnarmed')}</Form.Label
														>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="clergyArmed">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.security.clergyArmed} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.security.clergyArmed')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="congregantsArmed">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox
															{...attrs}
															bind:checked={$formData.security.congregantsArmed}
														/>
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.security.congregantsArmed')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="noFirearms">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.security.noFirearms} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('congregation.security.noFirearms')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										<Form.Field {form} name="security_other">
											<Form.Control let:attrs>
												<span class="flex flex-row items-start justify-start space-x-2">
													<span>
														<Checkbox {...attrs} bind:checked={$formData.security.other} />
													</span>
													<span class="-mt-0.5">
														<Form.Label>{$t('common.other')}</Form.Label>
													</span>
												</span>
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
										{#if $formData.security.other}
											<Form.Field {form} name="security_otherText">
												<Form.Control let:attrs>
													<Input {...attrs} bind:value={$formData.security.otherText} />
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										{/if}
										{#if securityErrors}
											<span class="text-xs text-red-500">{$t('common.required')}</span>
										{/if}
									</div>
									<div class="mt-4 flex flex-row items-center justify-end">
										<Button variant="secondary" on:click={() => (view = 'registration')}>
											{$t('common.next')} →
										</Button>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/if}

						<!-- registration -->
						{#if $formData.registration}
							{@const registrationErrors = fixType($errors.registration)}
							{@const registrationInvalid =
								fixType($errors.registration)?.email ||
								fixType($errors.registration)?.url ||
								fixType($errors.registration)?._errors}
							<Accordion.Item value="registration">
								<Accordion.Trigger>
									<span class="font-display text-lg">
										{$t('congregation.registration.registration')}
										{#if registrationErrors}
											<span class="text-red-500">*</span>
										{/if}
									</span>
								</Accordion.Trigger>
								<Accordion.Content>
									<div class="question mb-4" class:error={registrationErrors?.registrationType}>
										{$t('congregation.registration.extended')}
									</div>
									<Form.Field {form} name="protocol">
										<Form.Control let:attrs>
											<RadioGroup.Root
												{...attrs}
												class="space-y-2"
												bind:value={$formData.registration.registrationType}
												required
											>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="free" id="free" />
													<Form.Label for="free">{$t('congregation.registration.free')}</Form.Label>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="fixedPrice" id="fixedPrice" />
													<Form.Label for="fixedPrice"
														>{$t('congregation.registration.fixedPrice')}</Form.Label
													>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="slidingScale" id="slidingScale" />
													<Form.Label for="slidingScale">
														{$t('congregation.registration.slidingScale')}
													</Form.Label>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="suggestedDonation" id="suggestedDonation" />
													<Form.Label for="suggestedDonation">
														{$t('congregation.registration.suggestedDonation')}
													</Form.Label>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="other" id="other" />
													<Form.Label for="other">{$t('common.other')}</Form.Label>
												</div>
											</RadioGroup.Root>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									{#if $formData.registration.registrationType === 'other'}
										<Form.Field {form} name="registration_otherText">
											<Form.Control let:attrs>
												<Input {...attrs} bind:value={$formData.registration.otherText} />
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									{/if}
									{#if registrationErrors?.registrationType}
										<span class="mt-4 block text-xs text-red-500">{$t('common.required')}</span>
									{/if}
									<div class="question my-4" class:error={registrationInvalid}>
										{$t('congregation.registration.extended')}
									</div>
									<Form.Field {form} name="registration_email">
										<Form.Control let:attrs>
											<Form.Label for="registration_email">{$t('common.email')}</Form.Label>
											<Input {...attrs} bind:value={$formData.registration.email} />
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="registration_url">
										<Form.Control let:attrs>
											<Form.Label for="registration_url">{$t('common.website')}</Form.Label>
											<Input {...attrs} bind:value={$formData.registration.url} />
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
									{#if registrationInvalid}
										<span class="mt-4 block text-xs text-red-500">
											{$t('common.thingRequired', { thing: $t('common.emailOrUrl') })}
										</span>
									{/if}
									<div class="mt-4 flex flex-row items-center justify-end">
										<Button variant="secondary" on:click={() => (view = 'contact')}
											>{$t('common.next')} →</Button
										>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/if}

						<!-- contact -->
						<Accordion.Item value="contact">
							<Accordion.Trigger>
								<span class="font-display text-lg">
									{$t('congregation.contact')}
									{#if $errors.contactName || $errors.contactEmail}
										<span class="text-red-500">*</span>
									{/if}
								</span>
							</Accordion.Trigger>
							<Accordion.Content>
								<div class="question mb-4">{$t('congregation.contactName.extended')}</div>
								<Form.Field {form} name="contactName">
									<Form.Control let:attrs>
										<Form.Label for="contactName">
											{$t('congregation.contactName.contactName')}
										</Form.Label>
										<Input {...attrs} bind:value={$formData.contactName} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<div class="question my-4">{$t('congregation.contactEmail.extended')}</div>
								<Form.Field {form} name="contactEmail">
									<Form.Control let:attrs>
										<Form.Label for="contactEmail">
											{$t('congregation.contactEmail.contactEmail')}
										</Form.Label>
										<Input {...attrs} bind:value={$formData.contactEmail} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>

					<!-- visibiliy -->
					<div class="mt-8 flex flex-row items-center justify-end">
						{#if $user.admin}
							<Form.Field {form} name="visible">
								<Form.Control let:attrs>
									<span class="flex flex-row items-start justify-start space-x-2">
										<span>
											<Form.Label><strong>{$t('congregation.approved')}</strong></Form.Label>
										</span>
										<span>
											<Switch {...attrs} bind:checked={$formData.visible} />
										</span>
									</span>
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						{/if}
					</div>
				{/if}
			</Card.Content>

			<!-- actions -->
			<Card.Footer class="flex flex-col items-center justify-start space-y-4">
				{#if !addSuccess && !editSuccess}
					<div class="flex w-full flex-row items-center justify-between space-x-2">
						{#if mode === 'edit'}
							<div class="flex flex-row items-center justify-start space-x-2">
								<Delete data={data.delete} id={$formData?.id} />
								<Transfer data={data.transfer} id={$formData?.id} />
							</div>
						{/if}
						<!-- default -->
						<div
							class="flex flex-row items-center justify-end space-x-2"
							class:w-full={mode === 'add'}
						>
							<Button
								variant="outline"
								on:click={(e) => {
									e.preventDefault();
									e.stopPropagation();

									if (mode === 'add') {
										initData();
									} else {
										$formData = congregation;
									}
								}}
							>
								{$t('common.reset')}
							</Button>
							<Form.Button>{$t('common.submit')}</Form.Button>
						</div>
					</div>
				{/if}
			</Card.Footer>
		</form>
	</Card.Root>

	{#if dev}
		{#await import('sveltekit-superforms') then { default: SuperDebug }}
			<div class="mt-4"><SuperDebug data={$formData} /></div>
		{/await}
	{/if}
</section>

<style lang="postcss">
	.question {
		@apply text-base text-slate-600;

		&.error {
			@apply text-red-500;
		}
	}
</style>
