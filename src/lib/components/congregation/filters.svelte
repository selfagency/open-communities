<script lang="ts">
	/* region imports */
	import AccessibilityIcon from 'lucide-svelte/icons/accessibility';
	import OpenIcon from 'lucide-svelte/icons/chevrons-up-down';
	import CircleIcon from 'lucide-svelte/icons/circle';
	import CircleCheckIcon from 'lucide-svelte/icons/circle-check';
	import CircleMinusIcon from 'lucide-svelte/icons/circle-minus';
	import CloseIcon from 'lucide-svelte/icons/circle-x';
	import RegistrationIcon from 'lucide-svelte/icons/clipboard-pen';
	import FilterIcon from 'lucide-svelte/icons/filter';
	import AdminIcon from 'lucide-svelte/icons/settings';
	import SecurityIcon from 'lucide-svelte/icons/shield';
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';

	import MaskIcon from '$lib/assets/mask.svg?component';
	import SiddurIcon from '$lib/assets/siddur.svg?component';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { t } from '$lib/i18n';
	import { Search } from '$lib/search';
	import { user } from '$lib/stores';
	/* endregion imports */

	/* region variables */
	// props
	export let search: Search;

	// local vars
	let filters: Record<string, Record<string, boolean>>;

	/* endregion variables */

	/* region methods */
	const some = (object: Record<string, boolean>) => Object.values(object).some((filter) => filter);

	const every = (object: Record<string, boolean>) =>
		Object.values(object).every((filter) => filter);

	const initFilters = () => {
		filters = {
			services: {
				inPerson: false,
				onlineOnly: false,
				hybrid: false,
				offsite: false,
				other: false
			},
			accessibility: {
				inPerson_adaSome: false,
				inPerson_adaAll: false,
				inPerson_eva: false,
				hybrid_automatedCaptions: false,
				hybrid_liveCaptions: false,
				online_automatedCaptions: false,
				online_liveCaptions: false,
				other: false
			},
			health: {
				maskingRequired: false,
				maskingRecommended: false,
				noGuidelines: false,
				other: false
			},
			security: {
				localPolice: false,
				privateSecurityArmed: false,
				privateSecurityUnarmed: false,
				clergyArmed: false,
				congregantsArmed: false,
				noFirearms: false,
				other: false
			},
			registration: {
				free: false,
				fixedPrice: false,
				slidingScale: false,
				suggestedDonation: false,
				other: false
			},
			admin: {
				unapproved: false,
				unclaimed: false
			}
		};
	};
	/* endregion methods */

	/* region lifecycle */
	onMount(() => {
		initFilters();
	});
	/* endregion lifecycle */

	/* region reactivity */
	$: search.setFilters(filters);
	/* endregion reactivity */
</script>

<Popover.Root>
	<Popover.Trigger>
		<Button variant="outline" class="space-x-2 text-slate-500">
			<FilterIcon size="18" />
			<span>{$t('common.filter')}</span>
		</Button>
	</Popover.Trigger>
	<Popover.Content>
		<div class="flex flex-col items-start justify-start space-y-2 text-slate-500">
			{#if !isEmpty(filters?.services)}
				<Collapsible.Root>
					<Collapsible.Trigger>
						<div class="filter-heading">
							<span class="filter-icon">
								<SiddurIcon class="h-4 w-4 fill-slate-500 stroke-slate-500" />
							</span>
							<span class="filter-label">
								<span>{$t('congregation.services.services')}</span>
							</span>
							<span class="filter-status">
								{#if every(filters.services)}
									<CircleCheckIcon class="h-4 w-4" />
								{:else if some(filters.services)}
									<CircleMinusIcon class="h-4 w-4" />
								{:else}
									<CircleIcon class="h-4 w-4" />
								{/if}
							</span>
							<span class="filter-icon">
								<OpenIcon size="16" />
							</span>
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="filter-box">
							<span class="filter-item">
								<Checkbox
									id="services_inPerson"
									class="scale-75"
									bind:checked={filters.services.inPerson}
								/>
								<Label for="services_inPerson">
									<div class="filter-label">{$t('congregation.services.inPerson')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="services_onlineOnly"
									class="scale-75"
									bind:checked={filters.services.onlineOnly}
								/>
								<Label for="services_onlineOnly">
									<div class="filter-label">{$t('congregation.services.onlineOnly')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="services_hybrid"
									class="scale-75"
									bind:checked={filters.services.hybrid}
								/>
								<Label for="services_hybrid">
									<div class="filter-label">{$t('congregation.services.hybrid')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="services_offsite"
									class="scale-75"
									bind:checked={filters.services.offsite}
								/>
								<Label for="services_offsite">
									<div class="filter-label">{$t('congregation.services.offsite')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="services_other"
									class="scale-75"
									bind:checked={filters.services.other}
								/>
								<Label for="services_other">
									<div class="filter-label">{$t('common.other')}</div>
								</Label>
							</span>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			{/if}

			{#if !isEmpty(filters?.accessibility)}
				<Collapsible.Root>
					<Collapsible.Trigger>
						<div class="filter-heading">
							<span class="filter-icon"><AccessibilityIcon size="17" /></span>
							<span class="filter-label">
								<span>{$t('congregation.accessibility.accessibility')}</span>
							</span>
							<span class="filter-status">
								{#if every(filters.accessibility)}
									<CircleCheckIcon class="h-4 w-4" />
								{:else if some(filters.accessibility)}
									<CircleMinusIcon class="h-4 w-4" />
								{:else}
									<CircleIcon class="h-4 w-4" />
								{/if}
							</span>
							<span class="filter-icon">
								<OpenIcon size="16" />
							</span>
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="filter-box">
							<span class="filter-item">
								<Checkbox
									id="accessibility_inPerson_adaSome"
									class="scale-75"
									bind:checked={filters.accessibility.inPerson_adaSome}
								/>
								<Label for="accessibility_inPerson_adaSome">
									<div class="filter-label">
										{$t('congregation.accessibility.inPerson_adaSome')}
									</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="accessibility_inPerson_adaAll"
									class="scale-75"
									bind:checked={filters.accessibility.inPerson_adaAll}
								/>
								<Label for="accessibility_inPerson_adaAll">
									<div class="filter-label">
										{$t('congregation.accessibility.inPerson_adaAll')}
									</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="accessibility_inPerson_eva"
									class="scale-75"
									bind:checked={filters.accessibility.inPerson_eva}
								/>
								<Label for="accessibility_inPerson_eva">
									<div class="filter-label">{$t('congregation.accessibility.inPerson_eva')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="accessibility_online_automatedCaptions"
									class="scale-75"
									bind:checked={filters.accessibility.online_automatedCaptions}
								/>
								<Label for="accessibility_online_automatedCaptions">
									<div class="filter-label">
										{$t('congregation.accessibility.online_automatedCaptions')}
									</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="accessibility_online_liveCaptions"
									class="scale-75"
									bind:checked={filters.accessibility.online_liveCaptions}
								/>
								<Label for="accessibility_online_liveCaptions">
									<div class="filter-label">
										{$t('congregation.accessibility.online_liveCaptions')}
									</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="accessibility_inPerson_asl"
									class="scale-75"
									bind:checked={filters.accessibility.inPerson_asl}
								/>
								<Label for="accessibility_other">
									<div class="filter-label">{$t('congregation.accessibility.inPerson_asl')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="accessibility_online_asl"
									class="scale-75"
									bind:checked={filters.accessibility.online_asl}
								/>
								<Label for="accessibility_other">
									<div class="filter-label">{$t('congregation.accessibility.online_asl')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="accessibility_other"
									class="scale-75"
									bind:checked={filters.accessibility.other}
								/>
								<Label for="accessibility_other">
									<div class="filter-label">{$t('common.other')}</div>
								</Label>
							</span>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			{/if}

			{#if !isEmpty(filters?.health)}
				<Collapsible.Root>
					<Collapsible.Trigger>
						<div class="filter-heading">
							<span class="filter-icon">
								<MaskIcon class="h-5 w-5 fill-slate-500 stroke-slate-500" />
							</span>
							<span class="filter-label"><span>{$t('congregation.health.health')}</span></span>
							<span class="filter-status">
								{#if every(filters.health)}
									<CircleCheckIcon class="h-4 w-4" />
								{:else if some(filters.health)}
									<CircleMinusIcon class="h-4 w-4" />
								{:else}
									<CircleIcon class="h-4 w-4" />
								{/if}
							</span>
							<span class="filter-icon">
								<OpenIcon size="16" />
							</span>
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="filter-box">
							<span class="filter-item">
								<Checkbox
									id="health_maskingRequired"
									class="scale-75"
									bind:checked={filters.health.maskingRequired}
								/>
								<Label for="health_maskingRequired">
									<div class="filter-label">{$t('congregation.health.maskingRequired')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="health_maskingRecommended"
									class="scale-75"
									bind:checked={filters.health.maskingRecommended}
								/>
								<Label for="health_maskingRecommended">
									<div class="filter-label">{$t('congregation.health.maskingRecommended')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="health_noGuidelines"
									class="scale-75"
									bind:checked={filters.health.noGuidelines}
								/>
								<Label for="health_noGuidelines">
									<div class="filter-label">{$t('congregation.health.noGuidelines')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox id="health_other" class="scale-75" bind:checked={filters.health.other} />
								<Label for="health_other">
									<div class="filter-label">{$t('common.other')}</div>
								</Label>
							</span>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			{/if}

			{#if !isEmpty(filters?.security)}
				<Collapsible.Root>
					<Collapsible.Trigger>
						<div class="filter-heading">
							<span class="filter-icon">
								<SecurityIcon class="h-4 w-4  stroke-slate-500" />
							</span>
							<span class="filter-label"><span>{$t('congregation.security.security')}</span></span>
							<span class="filter-status">
								{#if every(filters.security)}
									<CircleCheckIcon class="h-4 w-4" />
								{:else if some(filters.security)}
									<CircleMinusIcon class="h-4 w-4" />
								{:else}
									<CircleIcon class="h-4 w-4" />
								{/if}
							</span>
							<span class="filter-icon">
								<OpenIcon size="16" />
							</span>
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="filter-box">
							<span class="filter-item">
								<Checkbox
									id="security_localPolice"
									class="scale-75"
									bind:checked={filters.security.localPolice}
								/>
								<Label for="security_localPolice">
									<div class="filter-label">{$t('congregation.security.localPolice')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="security_privateSecurityArmed"
									class="scale-75"
									bind:checked={filters.security.privateSecurityArmed}
								/>
								<Label for="security_privateSecurityArmed">
									<div class="filter-label">{$t('congregation.security.privateSecurityArmed')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="security_privateSecurityUnarmed"
									class="scale-75"
									bind:checked={filters.security.privateSecurityUnarmed}
								/>
								<Label for="security_privateSecurityUnarmed">
									<div class="filter-label">
										{$t('congregation.security.privateSecurityUnarmed')}
									</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="security_clergyArmed"
									class="scale-75"
									bind:checked={filters.security.clergyArmed}
								/>
								<Label for="security_clergyArmed">
									<div class="filter-label">
										{$t('congregation.security.clergyArmed')}
									</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="security_congregantsArmed"
									class="scale-75"
									bind:checked={filters.security.congregantsArmed}
								/>
								<Label for="security_congregantsArmed">
									<div class="filter-label">
										{$t('congregation.security.congregantsArmed')}
									</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="security_noFirearms"
									class="scale-75"
									bind:checked={filters.security.noFirearms}
								/>
								<Label for="security_noFirearms">
									<div class="filter-label">
										{$t('congregation.security.noFirearms')}
									</div>
								</Label>
							</span>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			{/if}

			{#if !isEmpty(filters?.registration)}
				<Collapsible.Root>
					<Collapsible.Trigger>
						<div class="filter-heading">
							<span class="filter-icon"><RegistrationIcon size="16" /></span>
							<span class="filter-label">
								<span>{$t('congregation.registration.registration')}</span>
							</span>
							<span class="filter-status">
								{#if every(filters.registration)}
									<CircleCheckIcon class="h-4 w-4" />
								{:else if some(filters.registration)}
									<CircleMinusIcon class="h-4 w-4" />
								{:else}
									<CircleIcon class="h-4 w-4" />
								{/if}
							</span>
							<span class="filter-icon">
								<OpenIcon size="16" />
							</span>
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="filter-box">
							<span class="filter-item">
								<Checkbox
									id="registration_free"
									class="scale-75"
									bind:checked={filters.registration.free}
								/>
								<Label for="registration_free">
									<div class="filter-label">{$t('congregation.registration.free')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="registration_fixedPrice"
									class="scale-75"
									bind:checked={filters.registration.fixedPrice}
								/>
								<Label for="registration_fixedPrice">
									<div class="filter-label">{$t('congregation.registration.fixedPrice')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="registration_slidingScale"
									class="scale-75"
									bind:checked={filters.registration.slidingScale}
								/>
								<Label for="registration_slidingScale">
									<div class="filter-label">{$t('congregation.registration.slidingScale')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="registration_suggestedDonation"
									class="scale-75"
									bind:checked={filters.registration.suggestedDonation}
								/>
								<Label for="registration_suggestedDonation">
									<div class="filter-label">
										{$t('congregation.registration.suggestedDonation')}
									</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="registration_other"
									class="scale-75"
									bind:checked={filters.registration.other}
								/>
								<Label for="registration_other">
									<div class="filter-label">{$t('common.other')}</div>
								</Label>
							</span>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			{/if}

			{#if $user.admin && !isEmpty(filters?.admin)}
				<Collapsible.Root>
					<Collapsible.Trigger>
						<div class="filter-heading">
							<span class="filter-icon"><AdminIcon size="16" /></span>
							<span class="filter-label">
								<span>{$t('common.admin')}</span>
							</span>
							<span class="filter-status">
								{#if every(filters.admin)}
									<CircleCheckIcon class="h-4 w-4" />
								{:else if some(filters.admin)}
									<CircleMinusIcon class="h-4 w-4" />
								{:else}
									<CircleIcon class="h-4 w-4" />
								{/if}
							</span>
							<span class="filter-icon">
								<OpenIcon size="16" />
							</span>
						</div>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="filter-box">
							<span class="filter-item">
								<Checkbox
									id="admin_unapproved"
									class="scale-75"
									bind:checked={filters.admin.unapproved}
								/>
								<Label for="admin_unapproved">
									<div class="filter-label">{$t('common.unapproved')}</div>
								</Label>
							</span>
							<span class="filter-item">
								<Checkbox
									id="admin_unclaimed"
									class="scale-75"
									bind:checked={filters.admin.unclaimed}
								/>
								<Label for="admin_unclaimed">
									<div class="filter-label">{$t('common.unclaimed')}</div>
								</Label>
							</span>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			{/if}

			<Button
				class="filter-heading h-auto p-0 text-slate-500"
				variant="link"
				on:click={() => initFilters()}
			>
				<span class="filter-icon"><CloseIcon size="16" /></span>
				<span class="filter-label"><span>{$t('common.reset')}</span></span>
			</Button>
		</div>
	</Popover.Content>
</Popover.Root>
