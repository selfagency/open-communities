<script lang="ts">
/* region imports */
import { isEmpty } from 'radashi';
import { getContext, onMount, untrack } from 'svelte';
import { page } from '$app/state';
import Combobox from '$lib/components/global/combobox.svelte';
import * as Accordion from '$lib/components/ui/accordion';
import { Button } from '$lib/components/ui/button';
import * as Form from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import * as Select from '$lib/components/ui/select';
import { Textarea } from '$lib/components/ui/textarea';
import { Location } from '$lib/location';
import { m as mBase } from '$lib/paraglide/messages';

const m = mBase as Record<string, (...args: unknown[]) => string>;

import type { CongregationMetaRecord } from '$lib/pocketbase.d';
import type { LocationMeta, LocationRecord } from '$lib/types.d';
import { log } from '$lib/utils';

import Required from '../required.svelte';

/* endregion imports */

/* region variables */
// props
let {
  errors,
  form,
  formData,
  view = $bindable()
}: {
  errors?: any;
  form: any;
  formData: any;
  view?: string;
} = $props();

// contstants
const {
  load: loadLocation,
  setCity,
  setCountry,
  setState,
  state: location
} = new Location({ countries: page.data.countries });

const congregation = getContext('congregation') as CongregationMetaRecord;

const denominations = [
  { label: m.denomination_conservative(), value: 'conservative' },
  {
    label: m.denomination_reconstructionist(),
    value: 'reconstructionist'
  },
  { label: m.denomination_reform(), value: 'reform' },
  { label: m.denomination_renewal(), value: 'renewal' },
  { label: m.denomination_humanist(), value: 'humanist' },
  { label: m.denomination_orthodox(), value: 'orthodox' },
  {
    label: m.denomination_postDenominational(),
    value: 'postDenominational'
  },
  {
    label: m.denomination_multiDenominational(),
    value: 'multiDenominational'
  },
  { label: m.denomination_unaffiliated(), value: 'unaffiliated' },
  { label: m.other(), value: 'other' }
];

// locals
let country: string = $state('');
let province: string = $state('');
let city: string = $state('');

// methods
async function handleCountryChange(newValue: string) {
  country = newValue;
  await setCountry(newValue);
  province = '';
  city = '';
}

async function handleStateChange(newValue: string) {
  province = newValue;
  await setState(newValue);
  city = '';
}

function handleCityChange(newValue: string) {
  city = newValue;
  setCity(newValue);
}

// lifecycle

onMount(async () => {
  if (congregation) {
    const location = (congregation as CongregationMetaRecord)?.location as LocationMeta;

    city = location.city?.id as string;
    province = location.state?.id as string;
    country = location.country?.id as string;

    try {
      await loadLocation({
        city,
        country,
        state: province
      } as LocationRecord);
    } catch (error) {
      log.error('Error loading location:', error);
    }
  }
});

// reactivity
// Synchronize location state to the superform. Only writes when the location
// record has a fully-resolved set of IDs to avoid intermediate partial writes
// (the 3-step country→state→city cascade during loadLocation).
$effect(() => {
  const rec = $location?.record;
  const cityId = rec?.city?.id;
  const countryId = rec?.country?.id;
  if (cityId && countryId) {
    untrack(() => {
      $formData.location = {
        city: cityId,
        country: countryId,
        state: rec?.state?.id
      };
    });
  }
});
</script>

<Accordion.Item value="congregation">
  <Accordion.Trigger class="flex w-full flex-row items-center justify-between">
    <div
      class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal tracking-wider"
    >
      <span>{m.congregation()}</span>
      {#if isEmpty($formData?.name) || isEmpty($formData?.clergy) || isEmpty($formData?.flavor) || $errors.name || $errors.city || $errors.state || $errors.country || $errors.clergy || $errors.flavor}
        <span class="text-destructive">*</span>
      {/if}
    </div>
  </Accordion.Trigger>
  <Accordion.Content>
    <Form.Field {form} name="name">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="name">
            <span>{m.name()}</span>
            <Required set={!isEmpty($formData?.name)} />
          </Form.Label>
          <Input
            autocomplete="off"
            id="name"
            {...props}
            bind:value={$formData.name}
            required
            onchange={() => {
              $formData.name = $formData?.name?.trim();
            }}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    {#if $formData?.location}
      <Form.Field {form} name="country">
        <Form.Control>
          {#snippet children(props)}
            <Form.Label for="country"><span>{m.location()}</span></Form.Label>
            <Combobox
              id="country"
              items={$location.options.countryOptions}
              {...props}
              value={country}
              placeholder={m.selectThing({
                thing: m.location_country().toLowerCase()
              })}
              onChange={handleCountryChange}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <Form.Field {form} name="state">
        <Form.Control>
          {#snippet children(props)}
            <Form.Label for="state"><span>{m.location_state()}</span></Form.Label>
            <Combobox
              id="state"
              items={$location.options.stateOptions}
              {...props}
              value={province}
              placeholder={m.selectThing({
                thing: m.location_state().toLowerCase()
              })}
              disabled={!country || !$location.options.stateOptions}
              onChange={handleStateChange}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <Form.Field {form} name="city">
        <Form.Control>
          {#snippet children(props)}
            <Form.Label for="city"><span>{m.location_city()}</span></Form.Label>
            <Combobox
              id="city"
              items={$location.options.cityOptions}
              {...props}
              value={city}
              placeholder={m.selectThing({
                thing: m.location_city().toLowerCase()
              })}
              disabled={!province || !$location.options.cityOptions}
              onChange={handleCityChange}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    {/if}

    <Form.Field {form} name="contactUrl">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="contactUrl"><span>{m.website()}</span></Form.Label>
          <div class="text-xs text-muted-foreground">{m.http()}</div>
          <Input
            id="contactUrl"
            {...props}
            bind:value={$formData.contactUrl}
            onchange={() => {
              $formData.contactUrl = $formData?.contactUrl.trim();
            }}
          />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name="clergy">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="clergy">
            <span>{m.clergy_extended()}</span>
            <Required set={!isEmpty($formData?.clergy)} />
          </Form.Label>
          <Input id="clergy" {...props} bind:value={$formData.clergy} required />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name="denomination">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="denomination"><span>{m.denomination_extended()}</span></Form.Label>
          <Select.Root type="single" name="denomination" bind:value={$formData.denomination}>
            <Select.Trigger id="denomination" class="w-full" {...props}>
              {#if $formData?.denomination}
                {@const denom = `denomination_${$formData?.denomination}`}
                {m[denom]()}
              {:else}
                {m.selectThing({ thing: m.denomination().toLowerCase() })}
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
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="flavor">
            <span>{m.flavor_extended()}</span>
            <Required set={!isEmpty($formData?.flavor)} />
          </Form.Label>
          <Textarea id="flavor" {...props} bind:value={$formData.flavor} required />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name="notes">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="notes"><span>{m.notes_extended()}</span></Form.Label>
          <Textarea id="notes" {...props} bind:value={$formData.notes} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
    <div class="mt-4 flex flex-row items-center justify-end">
      <Button
        variant="secondary"
        onclick={() => { view = 'fit'; document.querySelector('[data-value="fit"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
        >{m.next()}
        →</Button
      >
    </div>
  </Accordion.Content>
</Accordion.Item>
