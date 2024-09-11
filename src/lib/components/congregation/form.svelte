<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { type SuperValidated, superForm } from 'sveltekit-superforms';
	import SuperDebug from 'sveltekit-superforms';
	import { joi } from 'sveltekit-superforms/adapters';

	import * as Accordion from '$lib/components/ui/accordion';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Textarea } from '$lib/components/ui/textarea';
	import { t } from '$lib/i18n';
	import { defaultSchema } from '$lib/schemas';
	import { user } from '$lib/stores';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let data: SuperValidated<any>;
	/* endregion variables */

	/* region methods */
	function initData() {
		$formData.name = '';
		$formData.city = '';
		$formData.state = '';
		$formData.country = '';
		$formData.clergy = '';
		$formData.flavor = '';
		$formData.contactName = $user.name;
		$formData.contactUrl = '';
		$formData.contactEmail = $user.email;

		$formData.fit = {
			publicStatement: false,
			clergyMember: false,
			multipleClergyMembers: false,
			other: false,
			otherText: ''
		};

		$formData.services = {
			inPerson: false,
			hybrid: false,
			onlineOnly: false,
			offsite: false,
			other: false,
			otherText: ''
		};

		$formData.accommodations = {
			online_asl: false,
			online_liveCaptions: false,
			online_automatedCaptions: false,
			hybrid_liveCaptions: false,
			hybrid_automatedCaptions: false,
			inPerson_adaAll: false,
			inPerson_adaSome: false,
			inPerson_asl: false,
			inPerson_eva: false,
			other: false,
			otherText: ''
		};

		$formData.safety = {
			protocol: '',
			otherText: ''
		};

		$formData.registration = {
			type: '',
			otherText: '',
			email: '',
			url: ''
		};
	}
	/* endregion methods */

	/* region form */
	const form = superForm(data, {
		id: 'addEditCongregation',
		dataType: 'json',
		validators: joi(defaultSchema),
		async onUpdate({ result }) {
			if (!isEmpty(result.data.form.errors)) {
				log.error(JSON.stringify(result.data.form.errors));
				if (result.data.form.errors.error) {
					toast.error(result.data.form.errors.error);
				}
			} else if (result.type === 'success') {
				log.debug(JSON.stringify(result.data.user));
				toast.success($t('base.congregation.addSuccess'));
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
	onMount(async () => {
		initData();
	});
</script>

<section class="m-auto w-full" style="max-width: 480px;">
	<Card.Root>
		<Card.Header>
			<Card.Title>{$formData?.name || $t('base.congregation.add')}</Card.Title>
			<!-- <Card.Description></Card.Description> -->
		</Card.Header>
		<Card.Content>
			{#if !isEmpty($formData)}
				<form method="POST" use:enhance class="space-y-2">
					<Accordion.Root>
						<Accordion.Item value="congregation">
							<Accordion.Trigger>{$t('base.congregation.congregation')}</Accordion.Trigger>
							<Accordion.Content>
								<Form.Field {form} name="name">
									<Form.Control let:attrs>
										<Form.Label>{$t('base.congregation.name')}</Form.Label>
										<Input {...attrs} bind:value={$formData.name} required />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="city">
									<Form.Control let:attrs>
										<Form.Label>{$t('base.congregation.city')}</Form.Label>
										<Input {...attrs} bind:value={$formData.city} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="state">
									<Form.Control let:attrs>
										<Form.Label>{$t('base.congregation.state')}</Form.Label>
										<Input {...attrs} bind:value={$formData.state} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="country">
									<Form.Control let:attrs>
										<Form.Label>{$t('base.congregation.country')}</Form.Label>
										<Input {...attrs} bind:value={$formData.country} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="contactUrl">
									<Form.Control let:attrs>
										<Form.Label>{$t('base.common.website')}</Form.Label>
										<Input {...attrs} bind:value={$formData.contactUrl} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="clergy">
									<Form.Control let:attrs>
										<Form.Label>{$t('base.congregation.clergy.extended')}</Form.Label>
										<Input {...attrs} bind:value={$formData.clergy} required />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="flavor">
									<Form.Control let:attrs>
										<Form.Label>{$t('base.congregation.flavor.extended')}</Form.Label>
										<Textarea {...attrs} bind:value={$formData.flavor} required />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>

					<Accordion.Root>
						<Accordion.Item value="fit">
							<Accordion.Trigger>{$t('base.fit.fit')}</Accordion.Trigger>
							<Accordion.Content>
								<div class="question">{$t('base.fit.extended')}</div>

								<div class="my-4 space-y-2">
									<Form.Field {form} name="publicStatement">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox {...attrs} bind:checked={$formData.fit.publicStatement} />
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.fit.publicStatement')}</Form.Label>
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
													<Form.Label>{$t('base.fit.clergyMember')}</Form.Label>
												</span>
											</span>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<Form.Field {form} name="multipleClergyMembers">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox {...attrs} bind:checked={$formData.fit.multipleClergyMembers} />
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.fit.multipleClergyMembers')}</Form.Label>
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
													<Form.Label>{$t('base.common.other')}</Form.Label>
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
								</div>

								<Form.Field {form} name="flag">
									<Form.Control let:attrs>
										<div class="question my-4">{$t('base.fit.flag.extended')}</div>
										<RadioGroup.Root {...attrs} class="space-y-2" bind:value={$formData.fit.flag}>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="no" id="no" />
												<Form.Label for="no">{$t('base.fit.flag.no')}</Form.Label>
											</div>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="yes" id="yes" />
												<Form.Label for="yes">{$t('base.fit.flag.yes')}</Form.Label>
											</div>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="yesBima" id="yesBima" />
												<Form.Label for="yesBima">{$t('base.fit.flag.yesBima')}</Form.Label>
											</div>
										</RadioGroup.Root>
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>

					<Accordion.Root>
						<Accordion.Item value="services">
							<Accordion.Trigger>{$t('base.services.services')}</Accordion.Trigger>
							<Accordion.Content>
								<div class="question">{$t('base.services.extended')}</div>

								<div class="my-4 space-y-2">
									<Form.Field {form} name="inPerson">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox {...attrs} bind:checked={$formData.services.inPerson} />
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.services.inPerson')}</Form.Label>
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
													<Form.Label>{$t('base.services.hybrid')}</Form.Label>
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
													<Form.Label>{$t('base.services.onlineOnly')}</Form.Label>
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
													<Form.Label>{$t('base.services.offsite')}</Form.Label>
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
													<Form.Label>{$t('base.common.other')}</Form.Label>
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
								</div>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>

					<Accordion.Root>
						<Accordion.Item value="accommodations">
							<Accordion.Trigger>{$t('base.accommodations.accommodations')}</Accordion.Trigger>
							<Accordion.Content>
								<div class="question">{$t('base.accommodations.extended')}</div>
								<div class="mt-2 italic text-slate-500">{$t('base.accommodations.note')}</div>

								<div class="my-4 space-y-2">
									<Form.Field {form} name="online_asl">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox {...attrs} bind:checked={$formData.services.online_asl} />
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.accommodations.online_asl')}</Form.Label>
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
														bind:checked={$formData.services.online_liveCaptions}
													/>
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.accommodations.online_liveCaptions')}</Form.Label>
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
														bind:checked={$formData.services.online_automatedCaptions}
													/>
												</span>
												<span class="-mt-0.5">
													<Form.Label
														>{$t('base.accommodations.online_automatedCaptions')}</Form.Label
													>
												</span>
											</span>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<Form.Field {form} name="hybrid_liveCaptions">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox
														{...attrs}
														bind:checked={$formData.services.hybrid_liveCaptions}
													/>
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.accommodations.hybrid_liveCaptions')}</Form.Label>
												</span>
											</span>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<Form.Field {form} name="hybrid_automatedCaptions">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox
														{...attrs}
														bind:checked={$formData.services.hybrid_automatedCaptions}
													/>
												</span>
												<span class="-mt-0.5">
													<Form.Label
														>{$t('base.accommodations.hybrid_automatedCaptions')}</Form.Label
													>
												</span>
											</span>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<Form.Field {form} name="inPerson_adaAll">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox {...attrs} bind:checked={$formData.services.inPerson_adaAll} />
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.accommodations.inPerson_adaAll')}</Form.Label>
												</span>
											</span>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<Form.Field {form} name="inPerson_adaSome">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox {...attrs} bind:checked={$formData.services.inPerson_adaSome} />
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.accommodations.inPerson_adaSome')}</Form.Label>
												</span>
											</span>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<Form.Field {form} name="inPerson_asl">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox {...attrs} bind:checked={$formData.services.inPerson_asl} />
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.accommodations.inPerson_asl')}</Form.Label>
												</span>
											</span>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<Form.Field {form} name="inPerson_eva">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox {...attrs} bind:checked={$formData.services.inPerson_eva} />
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.accommodations.inPerson_eva')}</Form.Label>
												</span>
											</span>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<Form.Field {form} name="accoms_other">
										<Form.Control let:attrs>
											<span class="flex flex-row items-start justify-start space-x-2">
												<span>
													<Checkbox {...attrs} bind:checked={$formData.accommodations.other} />
												</span>
												<span class="-mt-0.5">
													<Form.Label>{$t('base.common.other')}</Form.Label>
												</span>
											</span>
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									{#if $formData.accommodations.other}
										<Form.Field {form} name="accoms_otherText">
											<Form.Control let:attrs>
												<Input {...attrs} bind:value={$formData.accommodations.otherText} />
											</Form.Control>
											<Form.FieldErrors />
										</Form.Field>
									{/if}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>

					<Accordion.Root>
						<Accordion.Item value="safety">
							<Accordion.Trigger>{$t('base.safety.safety')}</Accordion.Trigger>
							<Accordion.Content>
								<Form.Field {form} name="protocol">
									<Form.Control let:attrs>
										<div class="question mb-4">{$t('base.safety.extended')}</div>
										<RadioGroup.Root
											{...attrs}
											class="space-y-2"
											bind:value={$formData.safety.protocol}
										>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="maskingRequired" id="maskingRequired" />
												<Form.Label for="maskingRequired"
													>{$t('base.safety.maskingRequired')}</Form.Label
												>
											</div>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="maskingRecommended" id="maskingRecommended" />
												<Form.Label for="maskingRecommended"
													>{$t('base.safety.maskingRecommended')}</Form.Label
												>
											</div>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="noGuidelines" id="noGuidelines" />
												<Form.Label for="noGuidelines">{$t('base.safety.noGuidelines')}</Form.Label>
											</div>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="other" id="other" />
												<Form.Label for="other">{$t('base.common.other')}</Form.Label>
											</div>
										</RadioGroup.Root>

										{#if $formData.safety.protocol === 'other'}
											<Form.Field {form} name="safety_otherText">
												<Form.Control let:attrs>
													<Input {...attrs} bind:value={$formData.safety.otherText} />
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										{/if}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>

					<Accordion.Root>
						<Accordion.Item value="registration">
							<Accordion.Trigger>{$t('base.registration.registration')}</Accordion.Trigger>
							<Accordion.Content>
								<Form.Field {form} name="protocol">
									<Form.Control let:attrs>
										<div class="question mb-4">{$t('base.registration.extended')}</div>
										<RadioGroup.Root
											{...attrs}
											class="space-y-2"
											bind:value={$formData.registration.type}
										>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="fixedPrice" id="fixedPrice" />
												<Form.Label for="fixedPrice"
													>{$t('base.registration.fixedPrice')}</Form.Label
												>
											</div>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="slidingScale" id="slidingScale" />
												<Form.Label for="slidingScale"
													>{$t('base.registration.slidingScale')}</Form.Label
												>
											</div>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="suggestedDonation" id="suggestedDonation" />
												<Form.Label for="suggestedDonation"
													>{$t('base.registration.suggestedDonation')}</Form.Label
												>
											</div>
											<div class="flex items-center space-x-2">
												<RadioGroup.Item value="other" id="other" />
												<Form.Label for="other">{$t('base.common.other')}</Form.Label>
											</div>
										</RadioGroup.Root>

										{#if $formData.registration.type === 'other'}
											<Form.Field {form} name="registration_otherText">
												<Form.Control let:attrs>
													<Input {...attrs} bind:value={$formData.registration.otherText} />
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										{/if}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<div class="question my-4">{$t('base.register.extended')}</div>

								<Form.Field {form} name="registration_email">
									<Form.Control let:attrs>
										<Form.Label for="registration_email">{$t('base.common.email')}</Form.Label>
										<Input {...attrs} bind:value={$formData.registration.email} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field {form} name="registration_url">
									<Form.Control let:attrs>
										<Form.Label for="registration_url">{$t('base.common.website')}</Form.Label>
										<Input {...attrs} bind:value={$formData.registration.url} />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>

					<Accordion.Root>
						<Accordion.Item value="contact">
							<Accordion.Trigger>{$t('base.congregation.contact')}</Accordion.Trigger>
							<Accordion.Content>
								<div class="question mb-4">{$t('base.congregation.contactName.extended')}</div>

								<Form.Field {form} name="contactName">
									<Form.Control let:attrs>
										<Form.Label for="contactName"
											>{$t('base.congregation.contactName.contactName')}</Form.Label
										>
										<Input {...attrs} bind:value={$formData.contactName} required />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<div class="question my-4">{$t('base.congregation.contactEmail.extended')}</div>

								<Form.Field {form} name="contactEmail">
									<Form.Control let:attrs>
										<Form.Label for="contactEmail"
											>{$t('base.congregation.contactEmail.contactEmail')}</Form.Label
										>
										<Input {...attrs} bind:value={$formData.contactEmail} required />
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>

					<Form.Button>{$t('base.auth.login')}</Form.Button>
				</form>
			{/if}
		</Card.Content>
		<!-- <Card.Footer></Card.Footer> -->
	</Card.Root>

	<div class="mt-4"><SuperDebug data={$formData} /></div>
</section>

<style lang="postcss">
	.question {
		@apply text-base text-slate-600;
	}
</style>
