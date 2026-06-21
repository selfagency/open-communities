<script lang="ts">
  /* region imports */
  import * as Accordion from '$lib/components/ui/accordion';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
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
  const hasFit: boolean = $derived(valueSet($formData.fit));
  /* endregion variables */

  /* region methods */
  const fixType = (input: any) => {
    return input as Record<string, unknown> & { _errors?: string[] | undefined };
  };
  /* endregion methods */
</script>

<!-- fit -->
{#if $formData.fit}
  {@const fitErrors = fixType($errors.fit)?._errors}
  <Accordion.Item value="fit">
    <Accordion.Trigger class="flex w-full flex-row items-center justify-between">
      <div class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal">
        <span>{m.fit()}</span>
        {#if !hasFit || fitErrors}
          <span class="text-red-500">*</span>
        {/if}
      </div>
    </Accordion.Trigger>
    <Accordion.Content>
      <div class="question" class:error={fitErrors}>
        {m.fit_extended()}
        <Required set={hasFit} />
      </div>
      <div class="my-4 space-y-2">
        <Form.Field {form} name="publicStatement">
          <Form.Control
            >{#snippet children(props)}
              <span class="flex flex-row items-start justify-start space-x-2">
                <span>
                  <Checkbox
                    id="publicStatement"
                    {...props}
                    checked={$formData.fit.publicStatement}
                    onCheckedChange={(checked) => {
                      $formData.fit.publicStatement = checked ?? false;
                    }} />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="publicStatement">{m.fit_publicStatement()}</Form.Label>
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
                    id="clergyMember"
                    {...props}
                    checked={$formData.fit.clergyMember}
                    onCheckedChange={(checked) => {
                      $formData.fit.clergyMember = checked ?? false;
                    }} />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="clergyMember">{m.fit_clergyMember()}</Form.Label>
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
                    id="multipleClergyMembers"
                    {...props}
                    checked={$formData.fit.multipleClergyMembers}
                    onCheckedChange={(checked) => {
                      $formData.fit.multipleClergyMembers = checked ?? false;
                    }} />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="multipleClergyMembers">{m.fit_multipleClergyMembers()}</Form.Label>
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
                  <Checkbox
                    id="fit_other"
                    {...props}
                    checked={$formData.fit.other}
                    onCheckedChange={(checked) => {
                      $formData.fit.other = checked ?? false;
                    }} />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="fit_other">{m.other()}</Form.Label>
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
                <Input id="fit_otherText" {...props} bind:value={$formData.fit.otherText} />
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
              <div class="question my-4 flex flex-col items-start justify-start space-y-2">
                <span>{m.flag_extended()}</span>
                <small>{m.flag_note()}</small>
              </div>
              <RadioGroup.Root {...props} bind:value={$formData.fit.flag}>
                <div class="flex items-center space-x-2">
                  <RadioGroup.Item value="no" id="no" />
                  <Form.Label for="no">{m.flag_no()}</Form.Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroup.Item value="yes" id="yes" />
                  <Form.Label for="yes">{m.flag_yes()}</Form.Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroup.Item value="yesBima" id="yesBima" />
                  <Form.Label for="yesBima">{m.flag_yesBima()}</Form.Label>
                </div>
              </RadioGroup.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      {/if}

      <div class="mt-4 flex flex-row items-center justify-end">
        <Button variant="secondary" onclick={() => (view = 'services')}>{m.next()} →</Button>
      </div>
    </Accordion.Content>
  </Accordion.Item>
{/if}
