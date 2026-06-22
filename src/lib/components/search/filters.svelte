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
  import { untrack } from 'svelte';

  import { page } from '$app/state';
  import MaskIcon from '$lib/assets/mask.svg?component';
  import DenominationIcon from '$lib/assets/menorah.svg?component';
  import SiddurIcon from '$lib/assets/siddur.svg?component';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { Label } from '$lib/components/ui/label';
  import * as Popover from '$lib/components/ui/popover';
  import { m } from '$lib/paraglide/messages';
  import type { Search } from '$lib/search';

  // import { log } from '$lib/utils';
  /* endregion imports */

  /* region variables */
  // props
  const { search }: { search: Search } = $props();

  // constants
  const initFilters = {
    accessibility: {
      inPerson_adaAll: false,
      inPerson_adaSome: false,
      inPerson_eva: false,
      online_automatedCaptions: false,
      online_liveCaptions: false,
      other: false
    },
    admin: {
      unapproved: false,
      unclaimed: false
    },
    denomination: {
      conservative: false,
      humanist: false,
      multiDenominational: false,
      orthodox: false,
      other: false,
      postDenominational: false,
      reconstructionist: false,
      reform: false,
      renewal: false,
      unaffiliated: false
    },
    health: {
      maskingRecommended: false,
      maskingRequired: false,
      noGuidelines: false,
      other: false
    },
    registration: {
      fixedPrice: false,
      free: false,
      other: false,
      slidingScale: false,
      suggestedDonation: false
    },
    security: {
      clergyArmed: false,
      congregantsArmed: false,
      localPolice: false,
      noFirearms: false,
      privateSecurityArmed: false,
      privateSecurityUnarmed: false,
      other: false
    },
    services: {
      hybrid: false,
      inPerson: false,
      offsite: false,
      onlineOnly: false,
      other: false
    }
  };

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

  const user = $derived(page.data.user);

  // locals
  let filters: Record<string, Record<string, boolean>> = $state(initFilters);
  /* endregion variables */

  /* region methods */
  const some = (object: Record<string, boolean>) => Object.values(object).some((filter) => filter);

  const every = (object: Record<string, boolean>) => Object.values(object).every((filter) => filter);

  const updateFilter = (category: string, option: string, checked: boolean) => {
    // Create a new filters object to ensure reactivity
    filters = {
      ...filters,
      [category]: {
        ...filters[category],
        [option]: checked
      }
    } as Record<string, Record<string, boolean>>;
  };

  const resetFilters = () => {
    filters = structuredClone(initFilters);
  };
  /* endregion methods */

  /* region reactivity */
  $effect(() => {
    // Update search filters whenever the filters object changes
    // untrack prevents the search instance from becoming a reactive dependency
    const currentFilters = filters;
    untrack(() => search.setFilters(currentFilters));
  });
  /* endregion reactivity */
</script>

<Popover.Root>
  <Popover.Trigger class="button space-x-2 text-slate-500 outline rtl:mx-1">
    <FilterIcon size="18" class="rtl:mx-1" />
    <span>{m.filter()}</span>
  </Popover.Trigger>
  <Popover.Content>
    <div class="flex flex-col items-start justify-start space-y-2 text-slate-500">
      {#each Object.keys(filters) as category, i (i)}
        {#if !isEmpty(filters?.[category]) && !(category === 'admin' && !user?.admin)}
          {@const StatusIcon =
            icons[every(filters[category]) ? 'circleCheck' : some(filters[category]) ? 'circleMinus' : 'circle']}
          <Collapsible.Root>
            <Collapsible.Trigger>
              <div class="filter-heading">
                <span class="filter-icon">
                  {#if category === 'denomination' || category === 'health' || category === 'services'}
                    {@const Icon = (icons as unknown as Record<string, typeof AccessibilityIcon>)[category]}
                    <span class="h-4 w-5 fill-slate-500">
                      <Icon />
                    </span>
                  {:else}
                    {@const Icon = (icons as unknown as Record<string, typeof AccessibilityIcon>)[category]}
                    <Icon size="17" />
                  {/if}
                </span>
                <span class="filter-label">
                  <span>{(m as Record<string, (args?: unknown) => string>)[category]()}</span>
                </span>
                <span class="filter-status">
                  <StatusIcon class="h-4 w-4" />
                </span>
                <span class="filter-icon">
                  <OpenIcon size="16" />
                </span>
              </div>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <div class="filter-box">
                {#each Object.keys(filters[category]) as option, i (i)}
                  <span class="filter-item">
                    <Checkbox
                      id={`${category}_${option}`}
                      class="scale-75"
                      checked={filters[category][option]}
                      onCheckedChange={(checked) => updateFilter(category, option, checked ?? false)} />
                    <Label for={`${category}_${option}`}>
                      <span class="filter-label text-slate-500">
                        {option === 'other'
                          ? m.other()
                          : (m as Record<string, (args?: unknown) => string>)[`${category}_${option}`]()}
                      </span>
                    </Label>
                  </span>
                {/each}
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        {/if}
      {/each}
      <Button class="filter-heading h-auto p-0 text-slate-500" variant="link" onclick={resetFilters}>
        <span class="filter-icon"><CloseIcon size="16" /></span>
        <span class="filter-label"><span>{m.reset()}</span></span>
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
