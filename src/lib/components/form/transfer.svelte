<script lang="ts">
  /* region imports */
  import WarningIcon from "@lucide/svelte/icons/circle-alert";
  import { isEmpty } from "radashi";
  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { toast } from "svelte-sonner";
  import { type SuperValidated, superForm } from "sveltekit-superforms";

  import { dev } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Loading from "$lib/components/global/loading.svelte";
  import * as Alert from "$lib/components/ui/alert";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import * as Form from "$lib/components/ui/form";
  import { Input } from "$lib/components/ui/input";
  import { m } from "$lib/paraglide/messages";
  import { state as appState, setState } from "$lib/stores";
  import { log } from "$lib/utils";

  /* endregion imports */

  /* region variables */
  // props
  const {
    data,
    id,
    owner,
  }: {
    data: SuperValidated<any>;
    id: string;
    owner?: string;
  } = $props();

  // derived
  const user = $derived(page.data.user);

  // locals
  let open: boolean = $derived(page.url.searchParams.has("transfer"));
  /* endregion variables */

  /* region form */
  // svelte-ignore state_referenced_locally
  // Intentional: form is initialized once from server data (not reactive to prop changes)
  const form = superForm(data, {
    dataType: "json",
    id: "transferCongregation",
    onError({ result }) {
      setState({ loadingSecondary: false });
      log.error(result.error.message);
      toast.error(result.error.message);
    },
    onResult() {
      setState({ loadingSecondary: false });
    },
    onSubmit() {
      setState({ loadingSecondary: true });
    },
    async onUpdate({ result }) {
      setState({
        form: { hasErrors: false, success: false },
        loadingSecondary: false,
      });

      if (result.type === "success") {
        setState({ form: { hasErrors: false, success: true } });
        toast.success(m.transferSuccess());
        open = false;
      } else {
        setState({ form: { hasErrors: true, success: false } });
        if (!isEmpty(result.data.form.errors)) {
          log.error("form errors", result.data.form.errors);
        }
        if (!isEmpty(result.data.form.errors)) {
          log.error("submission error", result.data.form.errors);
        }
        toast.error(m.transferFailure());
      }
    },
  });

  const { enhance, form: formData } = form;
  /* endregion form */

  let loadingSecondary = $derived(appState.loadingSecondary);

  /* region lifecycle */
  onMount(() => {
    formData.set({
      email: page.url.searchParams.get("transfer"),
      id,
      owner,
    });
  });

  onDestroy(() => {
    setState({ loadingSecondary: false });
  });
  /* endregion lifecycle */
</script>

{#if user?.admin}
  <AlertDialog.Root bind:open>
    <AlertDialog.Trigger
      class="button border border-destructive/30 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
      onclick={(e: Event) => {
        e.preventDefault();
        open = true;
      }}
    >
      {m.transfer()}
    </AlertDialog.Trigger>
    <AlertDialog.Content>
      {#if loadingSecondary}
        <div
          transition:fade={{ delay: 300, duration: 100 }}
          class="flex h-full min-h-96 w-full flex-col items-center justify-center"
        >
          <Loading />
        </div>
      {:else}
        <form
          id="transfer"
          method="POST"
          action="?/transfer"
          use:enhance
          transition:fade={{ delay: 300, duration: 100 }}
        >
          <AlertDialog.Header>
            <AlertDialog.Title>{m.transfer()}</AlertDialog.Title>
            <AlertDialog.Description class="space-y-4">
              <div>{m.transfer_desc()}</div>

              <Alert.Root variant="destructive" class="my-4 bg-destructive/10">
                <WarningIcon size="18" />
                <Alert.Description class="mt-0.5"
                  >{m.warningNote()}</Alert.Description
                >
              </Alert.Root>

              <Form.Field {form} name="id">
                <Form.Control>
                  {#snippet children(props)}
                    <input type="hidden" {...props} bind:value={$formData.id} />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <Form.Field {form} name="email">
                <Form.Control>
                  {#snippet children(props)}
                    <Form.Label for="email">{m.email()}</Form.Label>
                    <Input {...props} bind:value={$formData.email} />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer class="mt-4">
            <AlertDialog.Cancel
              onclick={async (event) => {
                event.preventDefault();
                open = false;
                await goto(`${page.url.pathname}?id=${id}`);
              }}>{m.cancel()}</AlertDialog.Cancel
            >
            <AlertDialog.Action
              onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.submit(document.getElementById("transfer"));
              }}
            >
              {m.continue()}
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </form>
      {/if}
      {#if dev}
        {#await import("sveltekit-superforms") then { default: SuperDebug }}
          <div class="mt-4"><SuperDebug data={$formData} /></div>
        {/await}
      {/if}
    </AlertDialog.Content>
  </AlertDialog.Root>
{/if}
