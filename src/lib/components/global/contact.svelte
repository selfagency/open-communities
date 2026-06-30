<script lang="ts">
/* region imports */
import { onMount, untrack } from 'svelte';
import { fade } from 'svelte/transition';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';

import { dev } from '$app/environment';
import { page } from '$app/state';
import Captcha from '$lib/components/global/captcha.svelte';
import Combobox from '$lib/components/global/combobox.svelte';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Card from '$lib/components/ui/card';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Form from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Select from '$lib/components/ui/select';
import { Textarea } from '$lib/components/ui/textarea';
import { m as mBase } from '$lib/paraglide/messages';

const m = mBase as Record<string, (...args: unknown[]) => string>;

import { log } from '$lib/utils';

/* endregion imports */

/* region variables */
// props
let { congregations, data, snapshot = $bindable() }: { congregations: any; data: any; snapshot: any } = $props();

// derived
const user = $derived(page.data.user);

// locals
let success: boolean = $state(false);
let congregation: string = $state('');
/* endregion variables */

/* region form */
// svelte-ignore state_referenced_locally
// Intentional: form is initialized once from server data (not reactive to prop changes)
const form = superForm(data, {
  dataType: 'json',
  id: 'signup',
  onError({ result }) {
    log.error('submission error', result.error.message);
    toast.error(result.error.message);
  },
  // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
  async onUpdate({ form: f, result }) {
    if (!f.valid || result.type !== 'success') {
      log.error('form error', result.data.form.errors);
      if (result.data.form.errors) {
        log.error('submission error', result.data.form.errors);
        toast.error(m.emailFailure);
      }
    } else if (result.type === 'success') {
      toast.success(m.emailSuccess);
      success = true;
    }
  }
});

const { capture, enhance, form: formData, restore } = form;
snapshot = { capture, restore };
/* endregion form */

/* region lifecycle */
// biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
onMount(async () => {
  if (!$formData.reason) {
    $formData.reason = 'question';
  }
  if (!$formData.name) {
    $formData.name = user?.name || '';
  }
  if (!$formData.email) {
    $formData.email = user?.email || '';
  }
  if (!$formData.record) {
    $formData.record = '';
  }
  if (!$formData.message) {
    $formData.message = '';
  }
  if (!$formData.captcha) {
    $formData.captcha = '';
  }
});
/* endregion lifecycle */

/* region reactivity */
$effect(() => {
  if (page.url.searchParams.has('claim')) {
    untrack(() => {
      $formData.reason = 'claim';
      congregation = page.url.searchParams.get('claim') as string;
      $formData.record = congregation;
    });
  }
});
/* endregion reactivity */
</script>

<Card.Root class="mx-auto w-full max-w-md">
  <Card.Header>
    <Card.Title class="font-display text-2xl font-normal">
      {m.contact_contactUs()}
    </Card.Title>
    <!-- <Card.Description></Card.Description> -->
  </Card.Header>
  <Card.Content>
    {#if success}
      <span in:fade={{ delay: 200, duration: 100 }} out:fade={{ delay: 0, duration: 100 }}>
        {m.emailSuccessNotice()}
      </span>
    {:else}
      <form
        class="space-y-4"
        method="POST"
        use:enhance
        in:fade={{ delay: 200, duration: 100 }}
        out:fade={{ delay: 0, duration: 100 }}
      >
        <Form.Field {form} name="name">
          <Form.Control>
            {#snippet children(props)}
              <Form.Label>{m.name()}</Form.Label>
              <Input {...props} id="contact-name" aria-label={m.name()} required bind:value={$formData.name} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="email">
          <Form.Control>
            {#snippet children(props)}
              <Form.Label>{m.email()}</Form.Label>
              <Input {...props} id="contact-email" aria-label={m.email()} required bind:value={$formData.email} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="reason">
          <Form.Control>
            {#snippet children(props)}
              <Form.Label>{m.contact_reason()}</Form.Label>
              <Select.Root type="single" bind:value={$formData.reason}>
                <Select.Trigger class="w-full">
                  {@const reasonKey = `contactOptions_${$formData.reason}`}
                  {m[reasonKey]()}
                </Select.Trigger>
                <Select.Content {...props}>
                  <Select.Item value="question">{m.contactOptions_question()}</Select.Item>
                  <Select.Item value="suggest">{m.contactOptions_suggest()}</Select.Item>
                  <Select.Item value="claim">{m.contactOptions_claim()}</Select.Item>
                  <Select.Item value="delete">{m.contactOptions_delete()}</Select.Item>
                </Select.Content>
              </Select.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        {#if $formData.reason === 'claim' || $formData.reason === 'suggest'}
          <Form.Field {form} name="record">
            <Form.Control>
              {#snippet children(props)}
                <Form.Label>{m.contact_record()}</Form.Label>
                <Combobox
                  items={congregations}
                  {...props}
                  disabled={$formData.reason !== 'suggest' && $formData.reason !== 'claim'}
                  onChange={(id) => {
                    $formData.record = id;
                  }}
                  placeholder={m.selectThing({
                    thing: m.congregation().toLowerCase()
                  })}
                  bind:value={congregation}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        {/if}

        <Form.Field {form} name="message">
          <Form.Control>
            {#snippet children(props)}
              <Form.Label>{m.contact_message()}</Form.Label>
              <Form.Description class="text-destructive">
                {#if $formData.reason === 'delete'}
                  {m.contact_account()}
                {:else if $formData.reason === 'claim'}
                  {m.contact_proof()}
                {/if}
              </Form.Description>
              <Textarea {...props} id="contact-message" aria-label={m.contact_message()} required rows={8} bind:value={$formData.message} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Captcha {form} />

        <Form.Button>{m.contact_send()}</Form.Button>
      </form>

      {#if dev}
        {#await import('sveltekit-superforms') then { default: SuperDebug }}
          <div class="mt-4"><SuperDebug data={$formData} /></div>
        {/await}
      {/if}
    {/if}
  </Card.Content>
</Card.Root>
