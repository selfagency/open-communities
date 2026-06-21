<script lang="ts">
  /* region imports */

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
  const hasHealth: boolean = $derived(valueSet($formData.health));
  /* endregion variables */

  /* region methods */
  const fixType = (input: any) => {
    return input as Record<string, unknown> & { _errors?: string[] | undefined };
  };
  /* endregion methods */
</script>

<!-- health -->
{#if $formData.health}
  {@const healthErrors = fixType($errors.health)}
  <Accordion.Item value="health">
    <Accordion.Trigger class="flex w-full flex-row items-center justify-between">
      <div class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal">
        <span>{m.health()}</span>
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
              {m.health_extended()}
              <Required set={hasHealth} />
            </div>
            <RadioGroup.Root {...props} bind:value={$formData.health.protocol} required>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="maskingRequired" id="maskingRequired" />
                <Form.Label for="maskingRequired">{m.health_maskingRequired()}</Form.Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="maskingRecommended" id="maskingRecommended" />
                <Form.Label for="maskingRecommended">{m.health_maskingRecommended()}</Form.Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="noGuidelines" id="noGuidelines" />
                <Form.Label for="noGuidelines">{m.health_noGuidelines()}</Form.Label>
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
                    <Input id="health_otherText" {...props} bind:value={$formData.health.otherText} />
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
        <span class="mt-4 block text-xs text-red-500">{m.requiredResponse()}</span>
      {/if}
      <div class="mt-4 flex flex-row items-center justify-end">
        <Button variant="secondary" onclick={() => (view = 'security')}>
          {m.next()} →
        </Button>
      </div>
    </Accordion.Content>
  </Accordion.Item>
{/if}
