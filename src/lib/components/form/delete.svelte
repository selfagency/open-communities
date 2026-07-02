<script lang="ts">
/* region imports */
import WarningIcon from '@tabler/icons-svelte/icons/alert-circle';
import TrashIcon from '@tabler/icons-svelte/icons/trash';
import XIcon from '@tabler/icons-svelte/icons/x';

import { isEmpty } from 'radashi';
import { onMount } from 'svelte';
import { fade } from 'svelte/transition';
import { toast } from 'svelte-sonner';
import { type SuperValidated, superForm } from 'sveltekit-superforms';

import { dev } from '$app/environment';
import { goto } from '$app/navigation';
import Loading from '$lib/components/global/loading.svelte';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Alert from '$lib/components/ui/alert';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as AlertDialog from '$lib/components/ui/alert-dialog';
import { Button } from '$lib/components/ui/button';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Form from '$lib/components/ui/form';
import { m } from '$lib/paraglide/messages';
import { state as appState, setState } from '$lib/stores';
import { log } from '$lib/utils';

/* endregion imports */

/* region variables */
// props
const { data, id }: { data: SuperValidated<any>; id: string } = $props();
/* endregion variables */

/* region form */
// svelte-ignore state_referenced_locally
// Intentional: form is initialized once from server data (not reactive to prop changes)
const form = superForm(data, {
  dataType: 'json',
  id: 'deleteCongregation',
  onError({ result }) {
    log.error(result.error.message);
    toast.error(result.error.message);
    setState({ loadingSecondary: false });
  },
  onResult({ result }) {
    setState({ loadingSecondary: false });
    // Handle redirect case
    if (result.type === 'redirect') {
      toast.success(m.deleteSuccess());
    }
  },
  onSubmit() {
    setState({ loadingSecondary: true });
  },
  async onUpdate({ result }) {
    if (result.type === 'success') {
      toast.success(m.deleteSuccess());
      await goto('/');
    } else {
      if (!isEmpty(result.data?.form?.errors)) {
        log.error('form errors', result.data.form.errors);
      }
      if (!isEmpty(result.data?.form?.errors)) {
        toast.error(m.deleteFailure());
      }
    }
  }
});

const { enhance, form: formData } = form;
/* endregion form */

let loadingSecondary = $derived(appState.loadingSecondary);

/* region lifecycle */
onMount(() => {
  $formData.id = id;
});
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger>
    <Button variant="destructive"><TrashIcon class="mr-1.5 size-4" />{m.delete()}</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    {#if loadingSecondary}
      <div
        class="flex h-full min-h-96 w-full flex-col items-center justify-center"
        transition:fade={{ delay: 300, duration: 100 }}
      >
        <Loading />
      </div>
    {:else}
      <form action="?/delete" id="delete" method="POST" use:enhance transition:fade={{ delay: 300, duration: 100 }}>
        <AlertDialog.Header>
          <AlertDialog.Title>{m.warning()}</AlertDialog.Title>
          <AlertDialog.Description>
            <Alert.Root class="my-4 bg-destructive/10" variant="destructive">
              <WarningIcon size="18" />
              <Alert.Description class="mt-0.5">{m.warningNote()}</Alert.Description>
            </Alert.Root>

            <Form.Field {form} name="id">
              <Form.Control>
                {#snippet children(props)}
                  <input type="hidden" {...props} bind:value={$formData.id} />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            </Form.Field>
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel type="button"><XIcon class="mr-1.5 size-4" />{m.cancel()}</AlertDialog.Cancel>
          <AlertDialog.Action
            onclick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const formEl = document.getElementById("delete");
              // biome-ignore lint/style/useBlockStatements: intentional single-expression block
              if (form) form.submit(formEl);
            }}
            type="submit"
          >
            {m.continue()}
          </AlertDialog.Action>
        </AlertDialog.Footer>
      </form>
    {/if}
    {#if dev}
      {#await import("sveltekit-superforms") then { default: SuperDebug }}
        <div class="mt-4">
          <SuperDebug collapsed collapsible data={$formData} />
        </div>
      {/await}
    {/if}
  </AlertDialog.Content>
</AlertDialog.Root>
