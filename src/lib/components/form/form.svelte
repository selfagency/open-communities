<script lang="ts">
	/* region imports */
	import type { SuperValidated } from 'sveltekit-superforms';

	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import { isEmpty, shake, sleep } from 'radashi';
	import { getContext, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';

	import type { CongregationMetaRecord, PagesRecord } from '$lib/pocketbase.d';
	import type { LocationMeta, LocationRecord } from '$lib/types.d';

	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PUBLIC_CAPTCHA_SITE_KEY } from '$env/static/public';
	import Combobox from '$lib/components/global/combobox.svelte';
	import Loading from '$lib/components/global/loading.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Location } from '$lib/location';
	import * as m from '$lib/paraglide/messages';
	import { log } from '$lib/utils';

	import Delete from './delete.svelte';
	import Required from './required.svelte';
	import Transfer from './transfer.svelte';
	/* endregion imports */

	/* region variables */
	// props
	let {
		content,
		data,
		mode = $bindable('add'),
		snapshot = $bindable()
	}: {
		content?: PagesRecord;
		data: {
			default?: SuperValidated<any>;
			delete?: SuperValidated<any>;
			transfer?: SuperValidated<any>;
		};
		mode?: 'add' | 'edit';
		snapshot: string;
	} = $props();

	// constants
	const user = $derived(page.data.user);

	const valueSet = (obj: any): boolean => {
		if (!obj || isEmpty(obj)) return false;
		const shaken = shake(obj, (v) => (typeof v === 'boolean' ? v !== true : isEmpty(v)));
		return !isEmpty(shaken);
	};

	const {
		load: loadLocation,
		setCity,
		setCountry,
		setState,
		state: location
	} = new Location({ countries: page.data.countries });
	const congregation = getContext('congregation') as CongregationMetaRecord;
	const denominations = [
		{ label: m['denomination.conservative'](), value: 'conservative' },
		{
			label: m['denomination.reconstructionist'](),
			value: 'reconstructionist'
		},
		{ label: m['denomination.reform'](), value: 'reform' },
		{ label: m['denomination.renewal'](), value: 'renewal' },
		{ label: m['denomination.humanist'](), value: 'humanist' },
		{ label: m['denomination.orthodox'](), value: 'orthodox' },
		{
			label: m['denomination.postDenominational'](),
			value: 'postDenominational'
		},
		{
			label: m['denomination.multiDenominational'](),
			value: 'multiDenominational'
		},
		{ label: m['denomination.unaffiliated'](), value: 'unaffiliated' },
		{ label: m['other'](), value: 'other' }
	];

	// locals
	let country: string = $state('');
	let province: string = $state('');
	let city: string = $state('');

	let hasErrors: boolean = $state(false);
	let addSuccess: boolean = $state(false);
	let editSuccess: boolean = $state(false);

	let title: string = $state('');

	let view = $state('congregation') as string;
	let loading = $state(true);
	/* endregion variables */

	/* region methods */
	const fixType = (input: any) => {
		return input as Record<string, unknown> & { _errors?: string[] | undefined };
	};

	async function handleCountryChange(e: CustomEvent) {
		country = e.detail.value;
		await setCountry(country);
		province = '';
		city = '';
	}

	async function handleStateChange(e: CustomEvent) {
		province = e.detail.value;
		await setState(province);
		city = '';
	}

	function handleCityChange(e: CustomEvent) {
		city = e.detail.value;
		setCity(city);
	}

	function initData() {
		formData.set({
			accessibility: {
				inPerson_adaAll: false,
				inPerson_adaSome: false,
				inPerson_asl: false,
				inPerson_eva: false,
				online_asl: false,
				online_automatedCaptions: false,
				online_liveCaptions: false,
				other: false,
				otherText: ''
			},
			captcha: '',
			cleargy: '',
			contactEmail: '',
			contactName: '',
			contactUrl: '',
			denomination: '',
			fit: {
				clergyMember: false,
				flag: '',
				multipleClergyMembers: false,
				other: false,
				otherText: '',
				publicStatement: false
			},
			flavor: '',
			health: {
				otherText: '',
				protocol: ''
			},
			location: {
				city: '',
				country: '',
				latitude: 0,
				longitude: 0,
				state: ''
			},
			name: '',
			notes: '',
			registration: {
				email: '',
				otherText: '',
				registrationType: '',
				url: ''
			},
			security: {
				clergyArmed: false,
				congregantsArmed: false,
				localPolice: false,
				noFirearms: false,
				other: false,
				otherText: '',
				privateSecurityArmed: false,
				privateSecurityUnarmed: false
			},
			services: {
				hybrid: false,
				inPerson: false,
				offsite: false,
				onlineOnly: false,
				other: false,
				otherText: ''
			},
			user: user?.admin ? '' : user?.id,
			visible: false
		});
	}
	/* endregion methods */

	/* region form */
	const form = superForm(data.default, {
		dataType: 'json',
		id: 'addEditCongregation',
		onError({ result }) {
			log.error(result.error.message);
			toast.error(result.error.message);
		},
		// validators: zod(defaultSchema),
		async onUpdate({ result }) {
			hasErrors = false;

			if (result.type === 'success') {
				toast.success(mode === 'edit' ? m.editSuccess() : m.addSuccess());
				if (user?.admin) {
					await goto('/', { invalidateAll: true });
				} else {
					if (mode === 'add') {
						addSuccess = true;
					} else {
						editSuccess = true;
					}
				}
			} else {
				hasErrors = true;
				errors.set(result.data.form.errors);
				if (!isEmpty(result.data.form.errors)) log.error('form errors', result.data.form.errors);
				if (!isEmpty(result.data.form.error)) log.error('submission error', result.data.form.error);
				toast.error(mode === 'edit' ? m.editFailure() : m.addFailure());
			}
		}
	});

	const { enhance, errors, form: formData } = form;

	const hasFit: boolean = $derived(valueSet($formData.fit));
	const hasServices: boolean = $derived(valueSet($formData.services));
	const hasHealth: boolean = $derived(valueSet($formData.health));
	const hasRegistration: boolean = $derived(valueSet($formData.registration));
	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		if (!$formData?.id) {
			initData();
			loading = false;
		} else {
			const location = (congregation as CongregationMetaRecord)?.location as LocationMeta;

			city = location.city?.id as string;
			province = location.state?.id as string;
			country = location.country?.id as string;

			await loadLocation({
				city,
				country,
				state: province
			} as LocationRecord);

			loading = false;
		}

		if (!user?.admin) {
			$formData.visible = false;
		}

		if (browser) {
			await sleep(500);
			const widget = document.querySelector('cap-widget');
			widget?.addEventListener('solve', function (e) {
				$formData.captcha = e.detail.token;
			});
		}
	});
	/* endregion lifecycle */

	/* region reactivity */
	$effect(() => {
		if (addSuccess || editSuccess) {
			title = m.success({
				thing: mode === 'edit' ? m.edit().toLowerCase() : m.submission().toLowerCase()
			});
		} else {
			title = mode === 'edit' ? m.editThing({ thing: $formData.name }) : m.addCongregation();
		}
	});

	$effect(() => {
		if ($location?.record || congregation?.location) {
			let loc = ($location.record || congregation.location) as LocationMeta;
			$formData.location = {
				city: loc.city?.id,
				country: loc.country?.id,
				state: loc.state?.id
			};
		}
	});

	$effect(() => {
		if ($formData?.services?.onlineOnly) {
			$formData.health.protocol = 'other';
			$formData.health.otherText = 'N/A';
			$formData.security.other = true;
			$formData.security.otherText = 'N/A';
		}
	});
	/* endregion reactivity */
</script>

<section class="m-auto w-full" style="max-width: 480px;">
	<Card.Root>
		<div class="min-h-96">
			{#if loading}
				<div
					transition:fade={{ duration: 300 }}
					class="flex h-full min-h-96 w-full flex-col items-center justify-center"
				>
					<Card.Content>
						<Loading />
					</Card.Content>
				</div>
			{:else}
				<div transition:fade={{ delay: 300, duration: 300 }}>
					<!-- Add transition here -->

					<form id="addEdit" method="POST" action="?/submit" use:enhance class="min-h-[200px]">
						<Card.Header>
							<Card.Title class="font-display text-2xl font-normal">
								{title}
							</Card.Title>
						</Card.Header>
						<Card.Content>
							{#if mode === 'add' && content}
								<div class="prose">{@html content.content}</div>
							{/if}

							{#if mode === 'edit' && !user?.admin}
								<Alert.Root class="bg-slate-50">
									<WarningIcon size="18" />
									<Alert.Description class="mt-0.5">
										{m.editNotice()}
									</Alert.Description>
								</Alert.Root>
							{/if}

							{#if mode === 'add' && addSuccess}
								<p>{m.addSuccessNotice()}</p>
							{/if}

							{#if mode === 'edit' && editSuccess}
								<p>{m.editSuccessNotice()}</p>
							{/if}

							{#if !addSuccess && !editSuccess}
								{#if hasErrors}
									<span
										in:fade={{ delay: 300, duration: 150 }}
										out:fade={{ delay: 150, duration: 150 }}
									>
										<Alert.Root variant="destructive" class="my-4 bg-red-50">
											<WarningIcon size="18" />
											<Alert.Description class="mt-0.5">{m.formErrors()}</Alert.Description>
										</Alert.Root>
									</span>
								{/if}

								<Accordion.Root type="single" bind:value={view}>
									<!-- congregation -->
									<Accordion.Item value="congregation">
										<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
											<div
												class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
											>
												<span>{m.congregation()}</span>
												{#if isEmpty($formData.name) || isEmpty($formData.clergy) || isEmpty($formData.flavor) || $errors.name || $errors.city || $errors.state || $errors.country || $errors.clergy || $errors.flavor}
													<span class="text-red-500">*</span>
												{/if}
											</div>
										</Accordion.Trigger>
										<Accordion.Content>
											<Form.Field {form} name="name">
												<Form.Control>
													{#snippet children(props)}
														<Form.Label
															>{m.name()}
															<Required set={!isEmpty($formData.name)} /></Form.Label
														>
														<Input
															{...props}
															bind:value={$formData.name}
															required
															onchange={() => {
																$formData.name = $formData.name.trim();
															}}
														/>
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>

											{#if $formData.location}
												<Form.Field {form} name="country">
													<Form.Control>
														{#snippet children(props)}
															<Form.Label>{m['location.location']()}</Form.Label>
															<Combobox
																items={$location.options.countryOptions}
																{...props}
																value={country}
																placeholder={m.selectThing({
																	thing: m['location.country']().toLowerCase()
																})}
																on:change={handleCountryChange}
															/>
														{/snippet}
													</Form.Control>
													<Form.FieldErrors />
												</Form.Field>
												<Form.Field {form} name="state">
													<Form.Control>
														{#snippet children(props)}
															<Form.Label>{m['location.state']()}</Form.Label>
															<Combobox
																items={$location.options.stateOptions}
																{...props}
																value={province}
																placeholder={m.selectThing({
																	thing: m['location.state']().toLowerCase()
																})}
																disabled={!country || !$location.options.stateOptions}
																on:change={handleStateChange}
															/>
														{/snippet}
													</Form.Control>
													<Form.FieldErrors />
												</Form.Field>
												<Form.Field {form} name="city">
													<Form.Control>
														{#snippet children(props)}
															<Form.Label>{m['location.city']()}</Form.Label>
															<Combobox
																items={$location.options.cityOptions}
																{...props}
																value={city}
																placeholder={m.selectThing({
																	thing: m['location.city']().toLowerCase()
																})}
																disabled={!province || !$location.options.cityOptions}
																on:change={handleCityChange}
															/>
														{/snippet}
													</Form.Control>
													<Form.FieldErrors />
												</Form.Field>
											{/if}

											<Form.Field {form} name="contactUrl">
												<Form.Control>
													{#snippet children(props)}
														<Form.Label>{m.website()}</Form.Label>
														<div class="text-xs text-slate-500">{m.http()}</div>
														<Input
															{...props}
															bind:value={$formData.contactUrl}
															onchange={() => {
																$formData.contactUrl = $formData.contactUrl.trim();
															}}
														/>
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field {form} name="clergy">
												<Form.Control>
													{#snippet children(props)}
														<Form.Label
															>{m['clergy.extended']()}
															<Required set={!isEmpty($formData.clergy)} /></Form.Label
														>
														<Input {...props} bind:value={$formData.clergy} required />
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field {form} name="denomination">
												<Form.Control>
													{#snippet children(props)}
														<Form.Label>{m['denomination.extended']()}</Form.Label>
														<Select.Root
															type="single"
															name="denomination"
															bind:value={$formData.denomination}
														>
															<Select.Trigger class="w-full" {...props}>
																{#if $formData?.denomination}
																	{@const denom = `denomination.${$formData.denomination}`}
																	{m[denom]()}
																{/if}
															</Select.Trigger>
															<Select.Content {...props}>
																{#each denominations as { label, value }, i (i)}
																	<Select.Item {value}>{label}</Select.Item>
																{/each}
															</Select.Content>
														</Select.Root>
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field {form} name="flavor">
												<Form.Control
													>{#snippet children(props)}
														<Form.Label
															>{m['flavor.extended']()}
															<Required set={!isEmpty($formData.flavor)} /></Form.Label
														>
														<Textarea {...props} bind:value={$formData.flavor} required />
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field {form} name="notes">
												<Form.Control
													>{#snippet children(props)}
														<Form.Label>{m['notes.extended']()}</Form.Label>
														<Textarea {...props} bind:value={$formData.notes} />
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
											<div class="mt-4 flex flex-row items-center justify-end">
												<Button variant="secondary" onclick={() => (view = 'fit')}
													>{m.next()} →</Button
												>
											</div>
										</Accordion.Content>
									</Accordion.Item>

									<!-- fit -->
									{#if $formData.fit}
										{@const fitErrors = fixType($errors.fit)?._errors}
										<Accordion.Item value="fit">
											<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
												<div
													class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
												>
													<span>{m['fit.fit']()}</span>
													{#if !hasFit || fitErrors}
														<span class="text-red-500">*</span>
													{/if}
												</div>
											</Accordion.Trigger>
											<Accordion.Content>
												<div class="question" class:error={fitErrors}>
													{m['fit.extended']()}
													<Required set={hasFit} />
												</div>
												<div class="my-4 space-y-2">
													<Form.Field {form} name="publicStatement">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox
																			{...props}
																			bind:checked={$formData.fit.publicStatement}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['fit.publicStatement']()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													<Form.Field {form} name="clergyMember">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox
																			{...props}
																			bind:checked={$formData.fit.clergyMember}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['fit.clergyMember']()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													<Form.Field {form} name="multipleClergyMembers">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox
																			{...props}
																			bind:checked={$formData.fit.multipleClergyMembers}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['fit.multipleClergyMembers']()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													<Form.Field {form} name="fit_other">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox {...props} bind:checked={$formData.fit.other} />
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m.other()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													{#if $formData.fit.other}
														<Form.Field {form} name="fit_otherText">
															<Form.Control
																>{#snippet children(props)}
																	<Input {...props} bind:value={$formData.fit.otherText} />
																{/snippet}
															</Form.Control>
															<Form.FieldErrors />
														</Form.Field>
													{/if}
													{#if fitErrors}
														<span class="text-xs text-red-500">{m.requiredResponse()}</span>
													{/if}
												</div>

												<!-- flag -->
												{#if $formData.fit}
													<Form.Field {form} name="flag">
														<Form.Control
															>{#snippet children(props)}
																<div
																	class="question my-4 flex flex-col items-start justify-start space-y-2"
																>
																	<span>{m['fit.flag.extended']()}</span>
																	<small>{m['fit.flag.note']()}</small>
																</div>
																<RadioGroup.Root
																	{...props}
																	class="space-y-2"
																	bind:value={$formData.fit.flag}
																>
																	<div class="flex items-center space-x-2">
																		<RadioGroup.Item value="no" id="no" />
																		<Form.Label for="no">{m['fit.flag.no']()}</Form.Label>
																	</div>
																	<div class="flex items-center space-x-2">
																		<RadioGroup.Item value="yes" id="yes" />
																		<Form.Label for="yes">{m['fit.flag.yes']()}</Form.Label>
																	</div>
																	<div class="flex items-center space-x-2">
																		<RadioGroup.Item value="yesBima" id="yesBima" />
																		<Form.Label for="yesBima">{m['fit.flag.yesBima']()}</Form.Label>
																	</div>
																</RadioGroup.Root>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
												{/if}

												<div class="mt-4 flex flex-row items-center justify-end">
													<Button variant="secondary" onclick={() => (view = 'services')}
														>{m.next()} →</Button
													>
												</div>
											</Accordion.Content>
										</Accordion.Item>
									{/if}

									<!-- services -->
									{#if $formData.services}
										{@const servicesErrors = fixType($errors.services)?._errors}
										<Accordion.Item value="services">
											<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
												<div
													class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
												>
													<span>{m['services.services']()}</span>
													{#if !hasServices || servicesErrors}
														<span class="text-red-500">*</span>
													{/if}
												</div>
											</Accordion.Trigger>
											<Accordion.Content>
												<div class="question" class:error={servicesErrors}>
													{m['services.extended']()}
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
																			bind:checked={$formData.services.inPerson}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['services.inPerson']()}</Form.Label>
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
																		<Checkbox {...props} bind:checked={$formData.services.hybrid} />
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['services.hybrid']()}</Form.Label>
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
																			bind:checked={$formData.services.onlineOnly}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['services.onlineOnly']()}</Form.Label>
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
																			bind:checked={$formData.services.offsite}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['services.offsite']()}</Form.Label>
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
																		<Checkbox {...props} bind:checked={$formData.services.other} />
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m.other()}</Form.Label>
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
																		<Checkbox
																			{...props}
																			bind:checked={$formData.accessibility.online_asl}
																		/>
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
																		<Checkbox
																			{...props}
																			bind:checked={$formData.accessibility.online_liveCaptions}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label
																			>{m['accessibility.online_liveCaptions']()}</Form.Label
																		>
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
																			bind:checked={
																				$formData.accessibility.online_automatedCaptions
																			}
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
																		<Checkbox
																			{...props}
																			bind:checked={$formData.accessibility.inPerson_adaAll}
																		/>
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
																		<Checkbox
																			{...props}
																			bind:checked={$formData.accessibility.inPerson_adaSome}
																		/>
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
																		<Checkbox
																			{...props}
																			bind:checked={$formData.accessibility.inPerson_asl}
																		/>
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
																		<Checkbox
																			{...props}
																			bind:checked={$formData.accessibility.inPerson_eva}
																		/>
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
																		<Checkbox
																			{...props}
																			bind:checked={$formData.accessibility.other}
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
																	<Input
																		{...props}
																		bind:value={$formData.accessibility.otherText}
																	/>
																{/snippet}
															</Form.Control>
															<Form.FieldErrors />
														</Form.Field>
													{/if}
												</div>

												<div class="mt-4 flex flex-row items-center justify-end">
													<Button variant="secondary" onclick={() => (view = 'health')}
														>{m.next()} →</Button
													>
												</div>
											</Accordion.Content>
										</Accordion.Item>
									{/if}

									<!-- health -->
									{#if $formData.health}
										{@const healthErrors = fixType($errors.health)}
										<Accordion.Item value="health">
											<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
												<div
													class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
												>
													<span>{m['health.health']()}</span>
													{#if !hasHealth || healthErrors}
														<span class="text-red-500">*</span>
													{/if}
												</div>
											</Accordion.Trigger>
											<Accordion.Content>
												<Form.Field {form} name="protocol">
													<Form.Control
														>{#snippet children(props)}
															<div class="question mb-4" class:error={healthErrors?.protocol}>
																{m['health.extended']()}
																<Required set={hasHealth} />
															</div>
															<RadioGroup.Root
																{...props}
																class="space-y-2"
																bind:value={$formData.health.protocol}
																required
															>
																<div class="flex items-center space-x-2">
																	<RadioGroup.Item value="maskingRequired" id="maskingRequired" />
																	<Form.Label for="maskingRequired"
																		>{m['health.maskingRequired']()}</Form.Label
																	>
																</div>
																<div class="flex items-center space-x-2">
																	<RadioGroup.Item
																		value="maskingRecommended"
																		id="maskingRecommended"
																	/>
																	<Form.Label for="maskingRecommended"
																		>{m['health.maskingRecommended']()}</Form.Label
																	>
																</div>
																<div class="flex items-center space-x-2">
																	<RadioGroup.Item value="noGuidelines" id="noGuidelines" />
																	<Form.Label for="noGuidelines"
																		>{m['health.noGuidelines']()}</Form.Label
																	>
																</div>
																<div class="flex items-center space-x-2">
																	<RadioGroup.Item value="other" id="other" />
																	<Form.Label for="other">{m.other()}</Form.Label>
																</div>
															</RadioGroup.Root>
															{#if $formData.health.protocol === 'other'}
																<Form.Field {form} name="health_otherText">
																	<Form.Control
																		>{#snippet children(props)}
																			<Input {...props} bind:value={$formData.health.otherText} />
																		{/snippet}
																	</Form.Control>
																	<Form.FieldErrors />
																</Form.Field>
															{/if}
														{/snippet}
													</Form.Control>
													<Form.FieldErrors />
												</Form.Field>
												{#if healthErrors?.protocol}
													<span class="mt-4 block text-xs text-red-500">{m.requiredResponse()}</span
													>
												{/if}
												<div class="mt-4 flex flex-row items-center justify-end">
													<Button variant="secondary" onclick={() => (view = 'security')}>
														{m.next()} →
													</Button>
												</div>
											</Accordion.Content>
										</Accordion.Item>
									{/if}

									<!-- security -->
									{#if $formData.security}
										{@const securityErrors = fixType($errors.security)?._errors}
										<Accordion.Item value="security">
											<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
												<div
													class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
												>
													<span>{m['security.security']()}</span>
													{#if securityErrors}
														<span class="text-red-500">*</span>
													{/if}
												</div>
											</Accordion.Trigger>
											<Accordion.Content>
												<div class="question" class:error={securityErrors}>
													{m['security.extended']()}
												</div>
												<div class="my-4 space-y-2">
													<Form.Field {form} name="localPolice">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox
																			{...props}
																			bind:checked={$formData.security.localPolice}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['security.localPolice']()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													<Form.Field {form} name="privateSecurityArmed">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox
																			{...props}
																			bind:checked={$formData.security.privateSecurityArmed}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['security.privateSecurityArmed']()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													<Form.Field {form} name="privateSecurityUnarmed">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox
																			{...props}
																			bind:checked={$formData.security.privateSecurityUnarmed}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['security.privateSecurityUnarmed']()}</Form.Label
																		>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													<Form.Field {form} name="clergyArmed">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox
																			{...props}
																			bind:checked={$formData.security.clergyArmed}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['security.clergyArmed']()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													<Form.Field {form} name="congregantsArmed">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox
																			{...props}
																			bind:checked={$formData.security.congregantsArmed}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['security.congregantsArmed']()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													<Form.Field {form} name="noFirearms">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox
																			{...props}
																			bind:checked={$formData.security.noFirearms}
																		/>
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m['security.noFirearms']()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													<Form.Field {form} name="security_other">
														<Form.Control
															>{#snippet children(props)}
																<span class="flex flex-row items-start justify-start space-x-2">
																	<span>
																		<Checkbox {...props} bind:checked={$formData.security.other} />
																	</span>
																	<span class="-mt-0.5">
																		<Form.Label>{m.other()}</Form.Label>
																	</span>
																</span>
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
													{#if $formData.security.other}
														<Form.Field {form} name="security_otherText">
															<Form.Control
																>{#snippet children(props)}
																	<Input {...props} bind:value={$formData.security.otherText} />
																{/snippet}
															</Form.Control>
															<Form.FieldErrors />
														</Form.Field>
													{/if}
													{#if securityErrors}
														<span class="text-xs text-red-500">{m.requiredResponse()}</span>
													{/if}
												</div>
												<div class="mt-4 flex flex-row items-center justify-end">
													<Button variant="secondary" onclick={() => (view = 'registration')}>
														{m.next()} →
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
											<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
												<div
													class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
												>
													<span>{m['registration.registration']()}</span>
													{#if !hasRegistration || registrationErrors}
														<span class="text-red-500">*</span>
													{/if}
												</div>
											</Accordion.Trigger>
											<Accordion.Content>
												<div
													class="question mb-4"
													class:error={registrationErrors?.registrationType}
												>
													{m['registration.extended']()}
													<Required set={hasRegistration} />
												</div>
												<Form.Field {form} name="protocol">
													<Form.Control
														>{#snippet children(props)}
															<RadioGroup.Root
																{...props}
																class="space-y-2"
																bind:value={$formData.registration.registrationType}
																required
															>
																<div class="flex items-center space-x-2">
																	<RadioGroup.Item value="free" id="free" />
																	<Form.Label for="free">{m['registration.free']()}</Form.Label>
																</div>
																<div class="flex items-center space-x-2">
																	<RadioGroup.Item value="fixedPrice" id="fixedPrice" />
																	<Form.Label for="fixedPrice"
																		>{m['registration.fixedPrice']()}</Form.Label
																	>
																</div>
																<div class="flex items-center space-x-2">
																	<RadioGroup.Item value="slidingScale" id="slidingScale" />
																	<Form.Label for="slidingScale">
																		{m['registration.slidingScale']()}
																	</Form.Label>
																</div>
																<div class="flex items-center space-x-2">
																	<RadioGroup.Item
																		value="suggestedDonation"
																		id="suggestedDonation"
																	/>
																	<Form.Label for="suggestedDonation">
																		{m['registration.suggestedDonation']()}
																	</Form.Label>
																</div>
																<div class="flex items-center space-x-2">
																	<RadioGroup.Item value="other" id="other" />
																	<Form.Label for="other">{m.other()}</Form.Label>
																</div>
															</RadioGroup.Root>
														{/snippet}
													</Form.Control>
													<Form.FieldErrors />
												</Form.Field>
												{#if $formData.registration.registrationType === 'other'}
													<Form.Field {form} name="registration_otherText">
														<Form.Control
															>{#snippet children(props)}
																<Input {...props} bind:value={$formData.registration.otherText} />
															{/snippet}
														</Form.Control>
														<Form.FieldErrors />
													</Form.Field>
												{/if}
												{#if registrationErrors?.registrationType}
													<span class="mt-4 block text-xs text-red-500">{m.requiredResponse()}</span
													>
												{/if}
												<div class="question my-4" class:error={registrationInvalid}>
													{m['registration.contact']()}
													<Required
														set={!isEmpty($formData.registration.email) ||
															!isEmpty($formData.registration.url)}
													/>
												</div>
												<Form.Field {form} name="registration_email">
													<Form.Control
														>{#snippet children(props)}
															<Form.Label for="registration_email">{m.email()}</Form.Label>
															<Input
																{...props}
																bind:value={$formData.registration.email}
																onchange={() => {
																	$formData.registration.email =
																		$formData.registration.email.trim();
																}}
															/>
														{/snippet}
													</Form.Control>
													<Form.FieldErrors />
												</Form.Field>
												<Form.Field {form} name="registration_url">
													<Form.Control
														>{#snippet children(props)}
															<Form.Label for="registration_url">{m.website()}</Form.Label>
															<div class="text-xs text-slate-500">{m.http()}</div>
															<Input
																{...props}
																bind:value={$formData.registration.url}
																onchange={() => {
																	$formData.registration.url = $formData.registration.url.trim();
																}}
															/>
														{/snippet}
													</Form.Control>
													<Form.FieldErrors />
												</Form.Field>

												{#if registrationInvalid}
													<span class="mt-4 block text-xs text-red-500">
														{m.thingRequired({ thing: m.emailOrUrl() })}
													</span>
												{/if}
												<div class="mt-4 flex flex-row items-center justify-end">
													<Button variant="secondary" onclick={() => (view = 'contact')}
														>{m.next()} →</Button
													>
												</div>
											</Accordion.Content>
										</Accordion.Item>
									{/if}

									<!-- contact -->
									<Accordion.Item value="contact">
										<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
											<div
												class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
											>
												<span>{m['contact.contact']()}</span>
												{#if $errors.contactName || $errors.contactEmail}
													<span class="text-red-500">*</span>
												{/if}
											</div>
										</Accordion.Trigger>
										<Accordion.Content>
											<div class="question mb-4">{m['contactName.extended']()}</div>
											<Form.Field {form} name="contactName">
												<Form.Control
													>{#snippet children(props)}
														<Form.Label for="contactName">
															{m['contactName.contactName']()}
														</Form.Label>
														<Input {...props} bind:value={$formData.contactName} />
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
											<div class="question my-4">{m['contactEmail.extended']()}</div>
											<Form.Field {form} name="contactEmail">
												<Form.Control
													>{#snippet children(props)}
														<Form.Label for="contactEmail">
															{m['contactEmail.contactEmail']()}
														</Form.Label>
														<Input {...props} bind:value={$formData.contactEmail} />
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										</Accordion.Content>
									</Accordion.Item>
								</Accordion.Root>

								<!-- visibiliy -->
								<div class="mt-8 flex flex-row items-center justify-end">
									{#if user?.admin}
										<Form.Field {form} name="visible">
											<Form.Control
												>{#snippet children(props)}
													<span class="flex flex-row items-start justify-start space-x-2">
														<span>
															<Form.Label><strong>{m.approved()}</strong></Form.Label>
														</span>
														<span>
															<Switch {...props} bind:checked={$formData.visible} />
														</span>
													</span>
												{/snippet}
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									{/if}
								</div>
							{/if}

							<Form.Field {form} name="captcha">
								<Form.Control>
									<div class="mt-4 mb-8 w-full">
										<cap-widget
											data-cap-api-endpoint="https://captcha.selfagency.dev/{PUBLIC_CAPTCHA_SITE_KEY}/"
										></cap-widget>
									</div>
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</Card.Content>
					</form>

					<!-- actions -->
					<Card.Footer class="flex flex-col items-center justify-start space-y-4">
						{#if !addSuccess && !editSuccess}
							<div class="flex w-full flex-row items-center justify-between space-x-2">
								{#if mode === 'edit'}
									<div class="flex flex-row items-center justify-start space-x-2">
										<Delete data={data.delete as SuperValidated<any>} id={$formData?.id} />
										<Transfer
											data={data.transfer as SuperValidated<any>}
											id={$formData?.id}
											owner={congregation.owner}
										/>
									</div>
								{/if}
								<!-- default -->
								<div
									class="flex flex-row items-center justify-end space-x-2"
									class:w-full={mode === 'add'}
								>
									<Button
										variant="outline"
										type="reset"
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();

											if (mode === 'add') {
												initData();
											} else {
												$formData = congregation;
											}
										}}
									>
										{m.reset()}
									</Button>
									<Form.Button
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											form.submit(document.getElementById('addEdit'));
										}}>{m.submit()}</Form.Button
									>
								</div>
							</div>
						{/if}
					</Card.Footer>
				</div>
			{/if}
		</div></Card.Root
	>

	{#if dev}
		{#await import('sveltekit-superforms') then { default: SuperDebug }}
			<div class="mt-4"><SuperDebug data={$formData} /></div>
			<div class="mt-4"><SuperDebug data={$errors} /></div>
		{/await}
	{/if}
</section>
