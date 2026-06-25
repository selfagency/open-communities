<script lang="ts">
/* region imports */
import { isEmpty } from 'radashi';

import * as Accordion from '$lib/components/ui/accordion';
import { Button } from '$lib/components/ui/button';
import * as Form from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import * as RadioGroup from '$lib/components/ui/radio-group';
import { m } from '$lib/paraglide/messages';
import { valueSet } from '$lib/utils';

import Required from '../required.svelte';

/* endregion imports */

/* region variables */
// props
let { errors, form, formData, loading = $bindable(), view = $bindable() } = $props();

// constants
const hasRegistration: boolean = $derived(valueSet($formData.registration));
/* endregion variables */

/* region methods */
const fixType = (input: any) => input as Record<string, unknown> & { _errors?: string[] | undefined };
/* endregion methods */
</script>

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
        class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal tracking-wider"
      >
        <span>{m.registration()}</span>
        {#if !hasRegistration || registrationErrors}
          <span class="text-destructive">*</span>
        {/if}
      </div>
    </Accordion.Trigger>
    <Accordion.Content>
      <div class="question mb-4" class:error={registrationErrors?.registrationType}>
        {m.registration_extended()}
        <Required set={hasRegistration} />
      </div>
      <Form.Field {form} name="protocol">
        <Form.Control
          >{#snippet children(props)}
            <RadioGroup.Root {...props} required bind:value={$formData.registration.registrationType}>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item id="free" value="free" />
                <Form.Label for="free">{m.registration_free()}</Form.Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item id="fixedPrice" value="fixedPrice" />
                <Form.Label for="fixedPrice">{m.registration_fixedPrice()}</Form.Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item id="slidingScale" value="slidingScale" />
                <Form.Label for="slidingScale">
                  {m.registration_slidingScale()}
                </Form.Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item id="suggestedDonation" value="suggestedDonation" />
                <Form.Label for="suggestedDonation">
                  {m.registration_suggestedDonation()}
                </Form.Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item id="other" value="other" />
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
              <Input id="registration_otherText" {...props} bind:value={$formData.registration.otherText} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      {/if}
      {#if registrationErrors?.registrationType}
        <span class="mt-4 block text-xs text-destructive">{m.requiredResponse()}</span>
      {/if}
      <div class="question my-4" class:error={registrationInvalid}>
        {m.registration_contact()}
        <Required set={!isEmpty($formData.registration.email) || !isEmpty($formData.registration.url)} />
      </div>
      <Form.Field {form} name="registration_email">
        <Form.Control
          >{#snippet children(props)}
            <Form.Label for="registration_email">{m.email()}</Form.Label>
            <Input
              id="registration_email"
              {...props}
              onchange={() => {
                $formData.registration.email = $formData.registration.email.trim();
              }}
              bind:value={$formData.registration.email}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <Form.Field {form} name="registration_url">
        <Form.Control
          >{#snippet children(props)}
            <Form.Label for="registration_url">{m.website()}</Form.Label>
            <div class="text-xs text-muted-foreground">{m.http()}</div>
            <Input
              id="registration_url"
              {...props}
              onchange={() => {
                $formData.registration.url = $formData.registration.url.trim();
              }}
              bind:value={$formData.registration.url}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      {#if registrationInvalid}
        <span class="mt-4 block text-xs text-destructive">
          {m.thingRequired({ thing: m.emailOrUrl() })}
        </span>
      {/if}
      <div class="mt-4 flex flex-row items-center justify-end">
        <Button
          onclick={() => { view = 'contact'; document.querySelector('[data-value="contact"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
          variant="secondary"
          >{m.next()}
          →</Button
        >
      </div>
    </Accordion.Content>
  </Accordion.Item>
{/if}
