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
	import DenominationIcon from '$lib/assets/menorah.svg?component';
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

	// constants
	const icons = {
		accessibility: AccessibilityIcon,
		admin: AdminIcon,
		circle: CircleIcon,
		circleCheck: CircleCheckIcon,
		circleMinus: CircleMinusIcon,
		close: CloseIcon,
		denomination: DenominationIcon,
		filter: FilterIcon,
		health: MaskIcon,
		open: OpenIcon,
		registration: RegistrationIcon,
		security: SecurityIcon,
		services: SiddurIcon
	};

	// local vars
	let filters: Record<string, Record<string, boolean>>;

	/* endregion variables */

	/* region methods */
	const some = (object: Record<string, boolean>) => Object.values(object).some((filter) => filter);

	const every = (object: Record<string, boolean>) =>
		Object.values(object).every((filter) => filter);

	const initFilters = () => {
		filters = {
			denomination: {
				orthodox: false,
				conservative: false,
				reform: false,
				reconstructionist: false,
				renewal: false,
				humanist: false,
				postDenominational: false,
				multiDenominational: false,
				unaffiliated: false,
				other: false
			},
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
			<svelte:component this={icons.filter} size="18" />
			<span>{$t('common.filter')}</span>
		</Button>
	</Popover.Trigger>
	<Popover.Content>
		<div class="flex flex-col items-start justify-start space-y-2 text-slate-500">
			{#each Object.keys(filters) as category}
				{#if !isEmpty(filters?.[category]) && !(category === 'admin' && !$user.admin)}
					<Collapsible.Root>
						<Collapsible.Trigger>
							<div class="filter-heading">
								<span class="filter-icon">
									{#if category === 'denomination' || category === 'health' || category === 'services'}
										<span class="h-4 w-5 fill-slate-500">
											<svelte:component this={icons[category]} />
										</span>
									{:else}
										<svelte:component this={icons[category]} size="17" />
									{/if}
								</span>
								<span class="filter-label">
									<span>{$t(`congregation.${category}.${category}`)}</span>
								</span>
								<span class="filter-status">
									<svelte:component
										this={icons[
											every(filters[category])
												? 'circleCheck'
												: some(filters[category])
													? 'circleMinus'
													: 'circle'
										]}
										class="h-4 w-4"
									/>
								</span>
								<span class="filter-icon">
									<svelte:component this={icons.open} size="16" />
								</span>
							</div>
						</Collapsible.Trigger>
						<Collapsible.Content>
							<div class="filter-box">
								{#each Object.keys(filters[category]) as option}
									<span class="filter-item">
										<Checkbox
											id={`${category}_${option}`}
											class="scale-75"
											bind:checked={filters[category][option]}
										/>
										<Label for={`${category}_${option}`}>
											<span class="filter-label text-slate-500">
												{option === 'other'
													? $t('common.other')
													: $t(`congregation.${category}.${option}`)}
											</span>
										</Label>
									</span>
								{/each}
							</div>
						</Collapsible.Content>
					</Collapsible.Root>
				{/if}
			{/each}
			<Button
				class="filter-heading h-auto p-0 text-slate-500"
				variant="link"
				on:click={initFilters}
			>
				<span class="filter-icon"><svelte:component this={icons.close} size="16" /></span>
				<span class="filter-label"><span>{$t('common.reset')}</span></span>
			</Button>
		</div>
	</Popover.Content>
</Popover.Root>
