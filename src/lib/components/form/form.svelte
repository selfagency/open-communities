<script lang="ts">
	/* region imports */
	import type { SuperValidated } from 'sveltekit-superforms';

	import WarningIcon from 'lucide-svelte/icons/circle-alert';
	import { isEmpty, sleep } from 'radashi';
	import { getContext, onMount, untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';

	import type { CongregationMetaRecord, PagesRecord } from '$lib/pocketbase.d';

	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { PUBLIC_CAPTCHA_SITE_KEY } from '$env/static/public';
	import Loading from '$lib/components/global/loading.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Switch } from '$lib/components/ui/switch';
	import * as m from '$lib/paraglide/messages';
	import { log } from '$lib/utils';

	import Delete from './delete.svelte';
	import Accessibility from './segments/accessibility.svelte';
	import Congregation from './segments/congregation.svelte';
	import Contact from './segments/contact.svelte';
	import Fit from './segments/fit.svelte';
	import Health from './segments/health.svelte';
	import Registration from './segments/registration.svelte';
	import Security from './segments/security.svelte';
	import Services from './segments/services.svelte';
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
	const congregation = getContext('congregation') as CongregationMetaRecord;

	// locals
	let hasErrors: boolean = $state(false);
	let addSuccess: boolean = $state(false);
	let editSuccess: boolean = $state(false);

	let title: string = $state('');

	let view = $state('congregation') as string;
	let loading = $state(true);
	/* endregion variables */

	/* region methods */
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

	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		if (!$formData?.id) {
			initData();
			loading = false;
		} else {
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

			loading = false;
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
		if ($formData?.services?.onlineOnly) {
			untrack(() => {
				$formData.health.protocol = 'other';
				$formData.health.otherText = 'N/A';
				$formData.security.other = true;
				$formData.security.otherText = 'N/A';
			});
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
									<Congregation {errors} {form} {formData} bind:view />
									<Fit {errors} {form} {formData} bind:view />
									<Services {errors} {form} {formData} bind:view />
									<Accessibility {errors} {form} {formData} bind:view />
									<Health {errors} {form} {formData} bind:view />
									<Security {errors} {form} {formData} bind:view />
									<Registration {errors} {form} {formData} bind:view />
									<Contact {errors} {form} {formData} bind:view />
								</Accordion.Root>

								<!-- visibility -->
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
			<div class="mt-4"><SuperDebug data={form} collapsible collapsed /></div>
		{/await}
	{/if}
</section>
