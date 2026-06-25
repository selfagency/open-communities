<script lang="ts">
/* region imports */
import * as Accordion from '$lib/components/ui/accordion';
import { Button } from '$lib/components/ui/button';
import { Checkbox } from '$lib/components/ui/checkbox';
import * as Form from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import { m } from '$lib/paraglide/messages';

/* endregion imports */

/* region variables */
// props
let { errors, form, formData, view = $bindable() } = $props();
/* endregion variables */

/* region methods */
const fixType = (input: any) => input as Record<string, unknown> & { _errors?: string[] | undefined };
</script>

<!-- security -->
{#if $formData.security}
  {@const securityErrors = fixType($errors.security)?._errors}
  <Accordion.Item value="security">
    <Accordion.Trigger class="flex w-full flex-row items-center justify-between">
      <div
        class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal tracking-wider"
      >
        <span>{m.security()}</span>
        {#if securityErrors}
          <span class="text-destructive">*</span>
        {/if}
      </div>
    </Accordion.Trigger>
    <Accordion.Content>
      <div class="question" class:error={securityErrors}>
        {m.security_extended()}
      </div>
      <div class="my-4 space-y-2">
        <Form.Field {form} name="localPolice">
          <Form.Control
            >{#snippet children(props)}
              <span class="flex flex-row items-start justify-start space-x-2">
                <span>
                  <Checkbox
                    id="localPolice"
                    {...props}
                    checked={$formData.security.localPolice}
                    onCheckedChange={(checked) => {
                      $formData.security.localPolice = checked ?? false;
                    }}
                  />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="localPolice">{m.security_localPolice()}</Form.Label>
                </span>
              </span>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Form.Field {form} name="privateSecurityArmed">
          <Form.Control
            >{#snippet children(props)}
              <span class="flex flex-row items-start justify-start space-x-2">
                <span>
                  <Checkbox
                    id="privateSecurityArmed"
                    {...props}
                    checked={$formData.security.privateSecurityArmed}
                    onCheckedChange={(checked) => {
                      $formData.security.privateSecurityArmed = checked ?? false;
                    }}
                  />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="privateSecurityArmed">{m.security_privateSecurityArmed()}</Form.Label>
                </span>
              </span>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Form.Field {form} name="privateSecurityUnarmed">
          <Form.Control
            >{#snippet children(props)}
              <span class="flex flex-row items-start justify-start space-x-2">
                <span>
                  <Checkbox
                    id="privateSecurityUnarmed"
                    {...props}
                    checked={$formData.security.privateSecurityUnarmed}
                    onCheckedChange={(checked) => {
                      $formData.security.privateSecurityUnarmed = checked ?? false;
                    }}
                  />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="privateSecurityUnarmed">{m.security_privateSecurityUnarmed()}</Form.Label>
                </span>
              </span>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Form.Field {form} name="clergyArmed">
          <Form.Control
            >{#snippet children(props)}
              <span class="flex flex-row items-start justify-start space-x-2">
                <span>
                  <Checkbox
                    id="clergyArmed"
                    {...props}
                    checked={$formData.security.clergyArmed}
                    onCheckedChange={(checked) => {
                      $formData.security.clergyArmed = checked ?? false;
                    }}
                  />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="clergyArmed">{m.security_clergyArmed()}</Form.Label>
                </span>
              </span>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Form.Field {form} name="congregantsArmed">
          <Form.Control
            >{#snippet children(props)}
              <span class="flex flex-row items-start justify-start space-x-2">
                <span>
                  <Checkbox
                    id="congregantsArmed"
                    {...props}
                    checked={$formData.security.congregantsArmed}
                    onCheckedChange={(checked) => {
                      $formData.security.congregantsArmed = checked ?? false;
                    }}
                  />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="congregantsArmed">{m.security_congregantsArmed()}</Form.Label>
                </span>
              </span>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Form.Field {form} name="noFirearms">
          <Form.Control
            >{#snippet children(props)}
              <span class="flex flex-row items-start justify-start space-x-2">
                <span>
                  <Checkbox
                    id="noFirearms"
                    {...props}
                    checked={$formData.security.noFirearms}
                    onCheckedChange={(checked) => {
                      $formData.security.noFirearms = checked ?? false;
                    }}
                  />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="noFirearms">{m.security_noFirearms()}</Form.Label>
                </span>
              </span>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <Form.Field {form} name="security_other">
          <Form.Control
            >{#snippet children(props)}
              <span class="flex flex-row items-start justify-start space-x-2">
                <span>
                  <Checkbox
                    id="security_other"
                    {...props}
                    checked={$formData.security.other}
                    onCheckedChange={(checked) => {
                      $formData.security.other = checked ?? false;
                    }}
                  />
                </span>
                <span class="-mt-0.5">
                  <Form.Label for="security_other">{m.other()}</Form.Label>
                </span>
              </span>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        {#if $formData.security.other}
          <Form.Field {form} name="security_otherText">
            <Form.Control
              >{#snippet children(props)}
                <Input id="security_otherText" {...props} bind:value={$formData.security.otherText} />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        {/if}
        {#if securityErrors}
          <span class="text-xs text-destructive">{m.requiredResponse()}</span>
        {/if}
      </div>
      <div class="mt-4 flex flex-row items-center justify-end">
        <Button
          variant="secondary"
          onclick={() => { view = 'registration'; document.querySelector('[data-value="registration"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
        >
          {m.next()}
          →
        </Button>
      </div>
    </Accordion.Content>
  </Accordion.Item>
{/if}
