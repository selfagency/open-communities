<script lang="ts">
import { sleep } from 'radashi';
import { getContext, onMount, untrack } from 'svelte';
import { fade } from 'svelte/transition';
import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
import { browser } from '$app/environment';
import Captcha from '$lib/components/global/captcha.svelte';
import Loading from '$lib/components/global/loading.svelte';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Accordion from '$lib/components/ui/accordion';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Card from '$lib/components/ui/card';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Form from '$lib/components/ui/form';
import { Switch } from '$lib/components/ui/switch';
import { createInitForm } from '$lib/forms/defaults';
import { m } from '$lib/paraglide/messages';
import type { CongregationMetaRecord, PagesRecord, UsersRecord } from '$lib/pocketbase.d';
import { state as appState, setState } from '$lib/stores';
import FormAlerts from './form-alerts.svelte';
import FormFooter from './form-footer.svelte';
import Accessibility from './segments/accessibility.svelte';
import Congregation from './segments/congregation.svelte';
import Contact from './segments/contact.svelte';
import Fit from './segments/fit.svelte';
import Health from './segments/health.svelte';
import Registration from './segments/registration.svelte';
import Security from './segments/security.svelte';
import Services from './segments/services.svelte';

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

const congregation = getContext('congregation') as CongregationMetaRecord;

// svelte-ignore state_referenced_locally
const initForm = createInitForm(user);

let title: string = $state('');
let view = $state('congregation');

function initData() {
  untrack(() => {
    formData.set(initForm);
  });
}

// svelte-ignore state_referenced_locally
const { enhance, errors, form: formData } = form;

onMount(async () => {
  if (browser) {
    setState({
      form: { hasErrors: false, success: false },
      loadingSecondary: true
    });

    if (!$formData?.id) {
      initData();
    }

    await sleep(500);
    setState({ loadingSecondary: false });
  }
});

$effect(() => {
  if (appState.form?.success) {
    title = m.success({
      thing: mode === 'edit' ? m.edit().toLowerCase() : m.submission().toLowerCase()
    });
  } else {
    title = mode === 'edit' ? m.editThing({ thing: $formData.name ?? '' }) : m.addCongregation();
  }
});

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
              <Card.Title class="font-display text-2xl font-normal">{title}</Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="flex flex-col items-center justify-start">
                <FormAlerts {content} {formHasErrors} {formSuccess} {mode} {user} />

                {#if !formSuccess}
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

                  <div class="my-4 flex w-full flex-row items-start justify-end">
                    {#if user?.admin}
                      <Form.Field {form} name="visible">
                        <Form.Control>
                          {#snippet children(props)}
                            <span class="flex flex-row items-start justify-start space-x-2">
                              <span
                                ><Form.Label><strong>{m.approved()}</strong></Form.Label></span
                              >
                              <span><Switch {...props} bind:checked={$formData.visible} /></span>
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

          {#if !formSuccess}
            <Card.Footer class="flex flex-col items-center justify-start space-y-4">
              <FormFooter {congregation} {deletion} {form} {formData} {initData} {mode} />
            </Card.Footer>
          {/if}
        </div>
      {/if}
    </div>
  </Card.Root>
</section>
