<script lang="ts">
import SiddurIcon from '@tabler/icons-svelte/icons/book-2';
import CircleIcon from '@tabler/icons-svelte/icons/circle';
import CircleCheckIcon from '@tabler/icons-svelte/icons/circle-check';
import CircleMinusIcon from '@tabler/icons-svelte/icons/circle-minus';
import CloseIcon from '@tabler/icons-svelte/icons/circle-x';
import RegistrationIcon from '@tabler/icons-svelte/icons/clipboard-plus';
/* region imports */
import AccessibilityIcon from '@tabler/icons-svelte/icons/disabled';
import MaskIcon from '@tabler/icons-svelte/icons/face-mask';
import FilterIcon from '@tabler/icons-svelte/icons/filter';
import DenominationIcon from '@tabler/icons-svelte/icons/menorah';
import OpenIcon from '@tabler/icons-svelte/icons/selector';
import SecurityIcon from '@tabler/icons-svelte/icons/shield';
import { isEmpty } from 'radashi';
import { untrack } from 'svelte';
import { page } from '$app/state';
import { Button, buttonVariants } from '$lib/components/ui/button';
import { Checkbox } from '$lib/components/ui/checkbox';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace pattern
import * as Collapsible from '$lib/components/ui/collapsible';
import { Label } from '$lib/components/ui/label';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace pattern
import * as Popover from '$lib/components/ui/popover';
import { m as mBase } from '$lib/paraglide/messages';
import { cn } from '$lib/utils';

const m = mBase as Record<string, (...args: unknown[]) => string>;

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
  status: {
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

const icons: Record<string, any> = {
  accessibility: AccessibilityIcon,
  status: CircleCheckIcon,
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
  };
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
  <Popover.Trigger class={cn(buttonVariants({ variant: "outline" }), "group gap-2 rtl:mx-1")}>
    <FilterIcon
      class="transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:active:scale-90"
      size="18"
    />
    <span>{m.filter()}</span>
  </Popover.Trigger>
  <Popover.Content>
    <div class="flex flex-col items-start justify-start space-y-2 text-muted-foreground">
      {#each Object.keys(filters) as category, i (i)}
        {#if !(isEmpty(filters?.[category]) || (category === "status" && !user?.admin))}
          {@const StatusIcon =
            icons[
              every(filters[category])
                ? "circleCheck"
                : some(filters[category])
                  ? "circleMinus"
                  : "circle"
            ]}
          <Collapsible.Root>
            <Collapsible.Trigger>
              <div class="group filter-heading">
                {#if true}
                  {@const Icon = icons[category]}
                  <span class="filter-icon">
                    <Icon size="16" />
                  </span>
                {/if}
                <span class="filter-label">
                  <span>{m[category]()}</span>
                </span>
                <span class="filter-status">
                  <StatusIcon class="motion-safe:group-hover:scale-110 transition-transform duration-200" size="16" />
                </span>
                <span class="filter-icon">
                  <OpenIcon class="transition-transform duration-200 motion-safe:group-hover:scale-110" size="16" />
                </span>
              </div>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <div class="filter-box">
                {#each Object.keys(filters[category]) as option, i (i)}
                  <span class="filter-item">
                    <Checkbox
                      checked={filters[category][option]}
                      class="scale-75"
                      id={`${category}_${option}`}
                      onCheckedChange={(checked) =>
                        updateFilter(category, option, checked ?? false)}
                    />
                    <Label for={`${category}_${option}`}>
                      <span class="filter-label text-muted-foreground">
                        {option === "other"
                          ? m.other()
                          : m[`${category}_${option}`]()}
                      </span>
                    </Label>
                  </span>
                {/each}
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        {/if}
      {/each}
      <Button class="filter-heading h-auto p-0 text-muted-foreground" onclick={resetFilters} variant="link">
        <span class="filter-icon"><CloseIcon size="16" /></span>
        <span class="filter-label"><span>{m.reset()}</span></span>
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
