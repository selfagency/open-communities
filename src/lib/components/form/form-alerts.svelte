<script lang="ts">
import WarningIcon from '@tabler/icons-svelte/icons/alert-circle';
import DOMPurify from 'isomorphic-dompurify';
import { fade } from 'svelte/transition';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Alert from '$lib/components/ui/alert';
import { m } from '$lib/paraglide/messages';
import type { PagesRecord, UsersRecord } from '$lib/pocketbase.d';

let {
  content,
  formHasErrors,
  formSuccess,
  mode,
  user
}: {
  content?: PagesRecord;
  formHasErrors?: boolean;
  formSuccess?: boolean;
  mode: 'add' | 'edit';
  user: (UsersRecord & { id: string }) | undefined;
} = $props();
</script>

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

{#if !formSuccess && formHasErrors}
  <span in:fade={{ delay: 300, duration: 150 }} out:fade={{ delay: 150, duration: 150 }}>
    <Alert.Root class="my-4 bg-destructive/10" variant="destructive">
      <WarningIcon size="18" />
      <Alert.Description aria-live="polite" class="mt-0.5">{m.formErrors()}</Alert.Description>
    </Alert.Root>
  </span>
{/if}
