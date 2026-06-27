<script lang="ts">
import { untrack } from 'svelte';
import { Button } from '$lib/components/ui/button';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Form from '$lib/components/ui/form';
import { m } from '$lib/paraglide/messages';
import Delete from './delete.svelte';

let {
  deletion,
  form,
  formData,
  initData,
  mode,
  congregation
}: {
  deletion?: any;
  form: any;
  formData: any;
  initData: () => void;
  mode: 'add' | 'edit';
  congregation?: unknown;
} = $props();
</script>

<div class="flex w-full flex-row items-center justify-between space-x-2">
  {#if mode === "edit"}
    <div class="flex flex-row items-center justify-start space-x-2">
      <Delete data={deletion!} id={$formData?.id ?? ""} />
    </div>
  {/if}
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
