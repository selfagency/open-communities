<script lang="ts">
/* region imports */
import WarningIcon from '@tabler/icons-svelte/icons/alert-circle';
import DOMPurify from 'isomorphic-dompurify';
import { sleep } from 'radashi';
import { getContext, onMount, untrack } from 'svelte';
import { fade } from 'svelte/transition';
import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
import { browser, dev } from '$app/environment';
import Captcha from '$lib/components/global/captcha.svelte';
import Loading from '$lib/components/global/loading.svelte';
import * as Accordion from '$lib/components/ui/accordion';
import * as Alert from '$lib/components/ui/alert';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import * as Form from '$lib/components/ui/form';
import { Switch } from '$lib/components/ui/switch';
import { createInitForm } from '$lib/forms/defaults';
import { m } from '$lib/paraglide/messages';
import type { CongregationMetaRecord, PagesRecord, UsersRecord } from '$lib/pocketbase.d';
import { state as appState, setState } from '$lib/stores';

import Delete from './delete.svelte';
import Accessibility from './segments/accessibility.svelte';
import Congregation from './segments/congregation.svelte';
import Contact from './segments/contact.svelte';
import Fit from './segments/fit.svelte';
import Health from './segments/health.svelte';
import Registration from './segments/registration.svelte';
import Security from './segments/security.svelte';
import Services from './segments/services.svelte';

/* endregion imports */

/* region variables */
// props
let {
  content,
  deletion,
  form,
  mode = $bindable('add'),
  user
}: {
  content?: PagesRecord;
  deletion?: SuperValidated<any>;
  form: SuperForm<any, any>;
  mode: 'add' | 'edit';
  user: (UsersRecord & { id: string }) | undefined;
} = $props();

// constants
const congregation = getContext('congregation') as CongregationMetaRecord;

// svelte-ignore state_referenced_locally -- user prop is stable after mount
const initForm = createInitForm(user);

// locals
let title: string = $state('');
let view = $state('congregation');
/* endregion variables */

/* region methods */
function initData() {
  untrack(() => {
    formData.set(initForm);
  });
}
/* endregion methods */

/* region form */
// svelte-ignore state_referenced_locally
// Intentional: form is initialized once from server data (not reactive to prop changes)
const { enhance, errors, form: formData } = form;
/* endregion form */

/* region lifecycle */
onMount(async () => {
  if (browser) {
    setState({
      form: { hasErrors: false, success: false },
      loadingSecondary: true
    });

    if (!$formData?.id) {
      initData();
    }
    // Note: visible permission is enforced server-side in edit/+page.server.ts.
    // Do NOT mutate $formData here — it can trigger reactive loops in superforms.

    await sleep(500);

    setState({ loadingSecondary: false });
  }
});
/* endregion lifecycle */

/* region reactivity */
$effect(() => {
  if (appState.form?.success) {
    title = m.success({
      thing: mode === 'edit' ? m.edit().toLowerCase() : m.submission().toLowerCase()
    });
  } else {
    title = mode === 'edit' ? m.editThing({ thing: $formData.name ?? '' }) : m.addCongregation();
  }
});
/* endregion reactivity */

let loadingSecondary = $derived(appState.loadingSecondary);
let formSuccess = $derived(appState.form?.success);
let formHasErrors = $derived(appState.form?.hasErrors);
</script>

<section class="m-auto w-full" style="max-width: 480px;">
  <Card.Root>
    <div>
      {#if loadingSecondary}
        <div
          class="flex h-full min-h-96 w-full flex-col items-center justify-center"
          transition:fade={{ delay: 300, duration: 100 }}
        >
          <Card.Content>
            <Loading />
          </Card.Content>
        </div>
      {:else}
        <div transition:fade={{ delay: 300, duration: 100 }}>
          <form action="?/submit" class="min-h-96" id="addEdit" method="POST" use:enhance>
            <Card.Header>
              <Card.Title class="font-display text-2xl font-normal">
                {title}
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="flex flex-col items-center justify-start">
                {#if mode === "add" && content?.content && !formSuccess}
                  <div class="prose w-full">
                    {@html DOMPurify.sanitize(content.content)}
                  </div>
                {/if}

                {#if mode === "edit" && !user?.admin}
                  <Alert.Root class="bg-muted">
                    <WarningIcon size="18" />
                    <Alert.Description class="mt-0.5">
                      {m.editNotice()}
                    </Alert.Description>
                  </Alert.Root>
                {/if}

                {#if mode === "add" && formSuccess}
                  <p aria-live="polite">{m.addSuccessNotice()}</p>
                {/if}

                {#if mode === "edit" && formSuccess}
                  <p aria-live="polite">{m.editSuccessNotice()}</p>
                {/if}

                {#if !formSuccess}
                  {#if formHasErrors}
                    <span in:fade={{ delay: 300, duration: 150 }} out:fade={{ delay: 150, duration: 150 }}>
                      <Alert.Root class="my-4 bg-destructive/10" variant="destructive">
                        <WarningIcon size="18" />
                        <Alert.Description aria-live="polite" class="mt-0.5">{m.formErrors()}</Alert.Description>
                      </Alert.Root>
                    </span>
                  {/if}

                  <Accordion.Root class="w-full" type="single" bind:value={view}>
                    <Congregation {errors} {form} {formData} bind:view />
                    <Fit {errors} {form} {formData} bind:view />
                    <Services {errors} {form} {formData} bind:view />
                    <Accessibility {errors} {form} {formData} bind:view />
                    <Health {errors} {form} {formData} bind:view />
                    <Security {errors} {form} {formData} bind:view />
                    <Registration {errors} {form} {formData} bind:view />
                    <Contact {errors} {form} {formData} bind:view />
                  </Accordion.Root>

                  <!-- visibility -->
                  <div class="my-4 flex flex-row items-start justify-end w-full">
                    {#if user?.admin}
                      <Form.Field {form} name="visible">
                        <Form.Control
                          >{#snippet children(props)}
                            <span class="flex flex-row items-start justify-start space-x-2">
                              <span>
                                <Form.Label><strong>{m.approved()}</strong></Form.Label>
                              </span>
                              <span>
                                <Switch {...props} bind:checked={$formData.visible} />
                              </span>
                            </span>
                          {/snippet}
                        </Form.Control>
                        <Form.FieldErrors />
                      </Form.Field>
                    {/if}
                  </div>

                  {#if mode === "add"}
                    <Captcha {form} />
                  {/if}
                {/if}
              </div>
            </Card.Content>
          </form>

          <!-- actions -->
          <Card.Footer class="flex flex-col items-center justify-start space-y-4">
            {#if !formSuccess}
              <div class="flex w-full flex-row items-center justify-between space-x-2">
                {#if mode === "edit"}
                  <div class="flex flex-row items-center justify-start space-x-2">
                    <Delete data={deletion!} id={$formData?.id ?? ""} />
                  </div>
                {/if}
                <!-- default -->
                <div class="flex flex-row items-center justify-end space-x-2" class:w-full={mode === "add"}>
                  <Button
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      untrack(() => {
                        if (mode === "add") {
                          initData();
                        } else {
                          formData.set(congregation);
                        }
                      });
                    }}
                    type="reset"
                    variant="outline"
                  >
                    {m.reset()}
                  </Button>
                  <Form.Button
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.submit(document.getElementById("addEdit"));
                    }}
                    >{m.submit()}</Form.Button
                  >
                </div>
              </div>
            {/if}
          </Card.Footer>
        </div>
      {/if}
    </div>
  </Card.Root>

  {#if dev}
    {#await import("sveltekit-superforms") then { default: SuperDebug }}
      <div class="mt-4">
        <SuperDebug collapsed collapsible data={$formData} />
      </div>
    {/await}
  {/if}
</section>
