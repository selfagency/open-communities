<script lang="ts">
import CirclePlusIcon from '@tabler/icons-svelte/icons/circle-plus';
import RefreshIcon from '@tabler/icons-svelte/icons/refresh';
import TrashIcon from '@tabler/icons-svelte/icons/trash';
import { browser } from '$app/environment';
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '$lib/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '$lib/components/ui/alert-dialog';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
import { Input } from '$lib/components/ui/input';
import * as Pagination from '$lib/components/ui/pagination';
import { Textarea } from '$lib/components/ui/textarea';
import { m } from '$lib/paraglide/messages';

let { data } = $props();

// svelte-ignore state_referenced_locally
const locales = data.locales as string[];

// Search
// svelte-ignore state_referenced_locally
let searchValue = $state(data.pagination.search);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function onSearchInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  searchValue = val;
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    const params = new URLSearchParams($page.url.searchParams);
    if (val) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    goto(`/admin/translations?${params}`, { replaceState: true, keepFocus: true });
  }, 300);
}

// Pagination
// svelte-ignore state_referenced_locally
let currentPage = $state(data.pagination.page);

function onPageChange(p: number) {
  currentPage = p;
  const params = new URLSearchParams($page.url.searchParams);
  params.set('page', String(p));
  goto(`/admin/translations?${params}`, { replaceState: true, keepFocus: true });
}

// Accordion — track which key is open
let openKey = $state('');
let mounted = $state(false);

$effect(() => {
  mounted = true;
});

// Delete state
let deleteKey = $state('');
let showDeleteDialog = $state(false);

function confirmDelete(key: string) {
  deleteKey = key;
  showDeleteDialog = true;
}

// Add key state
let showAddDialog = $state(false);
let addKey = $state('');
let addValue = $state('');

// Per-key edit state: map of key -> { locale -> value }
let editState = $state<Record<string, Record<string, string>>>({});

function getEditValue(key: string, locale: string, original: string): string {
  return editState[key]?.[locale] ?? original;
}

function setEditValue(key: string, locale: string, val: string) {
  if (!editState[key]) {
    editState[key] = {};
  }
  editState[key][locale] = val;
}

function resetEditState(key: string) {
  const next = { ...editState };
  delete next[key];
  editState = next;
}

function buildEntries(key: string, entries: Array<{ locale: string; value: string; id?: string }>) {
  return entries.map((e) => ({
    locale: e.locale,
    value: editState[key]?.[e.locale] ?? e.value,
    id: e.id
  }));
}

// Redeploy state
let showWarning = $state(false);
let deploying = $state(false);
let deploymentUuid = $state<string | null>(null);
let deploymentStatus = $state<string | null>(null);
let deployError = $state<string | null>(null);
let pollTimer: ReturnType<typeof setInterval> | null = null;

function startDeploy() {
  showWarning = false;
  deploying = true;
  deployError = null;
  deploymentStatus = 'queued';
}

function pollStatus() {
  if (!deploymentUuid) {
    return;
  }
  pollTimer = setInterval(async () => {
    const form = new FormData();
    form.set('uuid', deploymentUuid ?? '');
    const res = await fetch('/admin/translations?/status', { method: 'POST', body: form });
    const json = await res.json();
    if (json.status) {
      deploymentStatus = json.status;
      if (json.status === 'success' || json.status === 'failed' || json.status === 'cancelled') {
        if (pollTimer) {
          clearInterval(pollTimer);
        }
        if (json.status === 'success') {
          setTimeout(() => window.location.reload(), 2000);
        }
      }
    }
  }, 3000);
}

function handleEnhance() {
  return async ({ result }: { result: { type: string; data?: Record<string, unknown> } }) => {
    if (result.type === 'success') {
      const d = result.data;
      if (d?.deploymentUuid) {
        deploymentUuid = d.deploymentUuid as string;
        pollStatus();
      }
      if (d?.error) {
        deployError = d.error as string;
        deploying = false;
      }
    } else {
      deployError = 'Deploy request failed';
      deploying = false;
    }
  };
}

function cancelDeploy() {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
  deploying = false;
  deploymentUuid = null;
  deploymentStatus = null;
  deployError = null;
}

const statusLabels: Record<string, string> = {
  queued: 'Queued',
  in_progress: 'Building...',
  success: 'Deployed!',
  failed: 'Failed',
  cancelled: 'Cancelled'
};
</script>

<svelte:head>
  <title>{m.translations()}</title>
</svelte:head>

<div class="space-y-6">
  {#if mounted}
    {#if deployError}
      <div class="bg-destructive/10 text-destructive rounded-lg border p-4 text-sm">{deployError}</div>
    {/if}

    <!-- Deployment progress overlay -->
    {#if deploying}
      <Dialog open={deploying}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploying Translations</DialogTitle>
            <DialogDescription>
              {statusLabels[deploymentStatus ?? 'queued'] ?? deploymentStatus}
            </DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-4">
            {#if deploymentStatus === 'in_progress'}
              <div class="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div class="bg-primary h-full w-1/2 animate-pulse rounded-full"></div>
              </div>
            {:else if deploymentStatus === 'success'}
              <div class="text-center text-sm text-green-600">Deployment complete. Reloading...</div>
            {:else if deploymentStatus === 'failed'}
              <div class="text-center text-sm text-red-600">Deployment failed.</div>
            {:else}
              <div class="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div class="bg-primary h-full w-1/3 animate-pulse rounded-full"></div>
              </div>
            {/if}
            <div class="flex justify-center">
              <Button onclick={cancelDeploy} variant="outline">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    {/if}

    <!-- Search -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-semibold">{m.translations()}</h2>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative shadow-xs">
          <svg
            class="absolute left-3 z-10 top-1/2 size-[18px] -translate-y-1/2 pointer-events-none text-muted-foreground"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            class="h-11 w-64 sm:w-80 pl-10"
            oninput={onSearchInput}
            placeholder="Search keys and translations..."
            value={searchValue}
          />
        </div>
        <AlertDialog bind:open={showWarning}>
          <AlertDialogTrigger>
            <Button variant="outline">
              <RefreshIcon class="mr-1.5 size-4" />
              Rebuild
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will trigger a full rebuild and redeploy of the site. The site may be briefly unavailable during
                deployment. Only proceed if you have saved your translation changes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <form action="?/redeploy" method="POST" onsubmit={startDeploy} use:enhance={handleEnhance}>
                <AlertDialogAction
                  class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  type="submit"
                  >Deploy</AlertDialogAction
                >
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onclick={() => { addKey = ''; addValue = ''; showAddDialog = true; }} variant="outline">
          <CirclePlusIcon class="mr-1.5 size-4" />
          Add Key
        </Button>
      </div>
    </div>

    <!-- Add Key Dialog -->
    <Dialog bind:open={showAddDialog}>
      <form
        action="?/add"
        method="POST"
        use:enhance={() => {
      return async ({ result }: { result: { type: string; data?: Record<string, unknown> } }) => {
        if (result.type === 'success' && result.data?.key) {
          showAddDialog = false;
          const newKey = result.data.key as string;
          // Navigate to first page and open the new key
          const params = new URLSearchParams();
          params.set('page', '1');
          goto(`/admin/translations?${params}`, { replaceState: true });
          // Set the key to open after navigation
          setTimeout(() => { openKey = newKey; }, 500);
        }
      };
    }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Translation Key</DialogTitle>
            <DialogDescription>Create a new translation key with an English value.</DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <label class="text-sm font-medium" for="add-key">Key</label>
              <Input id="add-key" name="key" placeholder="myNewKey" required bind:value={addKey} />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium" for="add-value">English Value</label>
              <Input id="add-value" name="value" placeholder="My New Key" bind:value={addValue} />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button onclick={() => (showAddDialog = false)} variant="outline">Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </DialogContent>
      </form>
    </Dialog>

    <!-- Results count -->
    <p class="text-muted-foreground text-sm">
      {data.pagination.total}
      key{data.pagination.total === 1 ? '' : 's'}
      {#if data.pagination.search}
        matching &ldquo;{data.pagination.search}&rdquo;
      {/if}
    </p>

    <!-- Accordion -->
    <Accordion bind:value={openKey}>
      {#each data.translations as { key, entries } (key)}
        {@const enEntry = entries.find((e: { locale: string }) => e.locale === 'en')}
        <AccordionItem value={key}>
          <AccordionTrigger>
            <span class="flex items-start gap-6 min-w-0 flex-1">
              <span class="font-mono text-sm font-medium leading-6 shrink-0 w-48 truncate">{key}</span>
              <span class="text-muted-foreground truncate text-sm leading-6 flex-1 min-w-0">
                {enEntry?.value ?? ''}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <form
              action="?/save"
              class="space-y-3"
              method="POST"
              use:enhance={() => {
              return async ({ result }: { result: { type: string } }) => {
                if (result.type === 'success') {
                  resetEditState(key);
                }
              };
            }}
            >
              <input name="key" type="hidden" value={key} />
              <input name="entries" type="hidden" value={JSON.stringify(buildEntries(key, entries))} />

              {#each locales as locale}
                {@const entry = entries.find((e: { locale: string }) => e.locale === locale)}
                <div class="grid grid-cols-[40px_1fr] items-start gap-2">
                  <label
                    class="text-muted-foreground pt-2.5 text-xs font-mono font-medium uppercase"
                    for={`text-${key}-${locale}`}
                  >
                    {locale}
                  </label>
                  <Textarea
                    class="min-h-[40px] text-base leading-relaxed bg-white dark:bg-white/5"
                    id={`text-${key}-${locale}`}
                    name={locale}
                    oninput={(e) => setEditValue(key, locale, (e.target as HTMLTextAreaElement).value)}
                    placeholder="—"
                    rows={1}
                    style={locale === 'he' ? 'direction: rtl' : undefined}
                    value={getEditValue(key, locale, entry?.value ?? '')}
                  />
                </div>
              {/each}

              <div class="flex items-center justify-end gap-2 pt-2">
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button type="button" variant="destructive">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete &ldquo;{key}&rdquo;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this key and all its translations across every locale. This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <form
                        action="?/delete"
                        method="POST"
                        use:enhance={() => {
                      return async ({ result }: { result: { type: string } }) => {
                        if (result.type === 'success') {
                          goto('/admin/translations', { replaceState: true });
                        }
                      };
                    }}
                      >
                        <input name="key" type="hidden" value={key} />
                        <AlertDialogAction
                          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          type="submit"
                          >Delete</AlertDialogAction
                        >
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </AccordionContent>
        </AccordionItem>
      {/each}
    </Accordion>

    <!-- Pagination -->
    {#if data.pagination.totalPages > 1}
      <div class="flex w-full scale-90 flex-row items-center justify-center pt-4 sm:scale-100">
        <Pagination.Root
          count={data.pagination.total}
          {onPageChange}
          page={currentPage}
          perPage={data.pagination.perPage}
          siblingCount={0}
        >
          {#snippet children({ pages })}
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.PrevButton />
              </Pagination.Item>
              {#each pages as p (p.key)}
                {#if p.type === "ellipsis"}
                  <Pagination.Item>
                    <Pagination.Ellipsis />
                  </Pagination.Item>
                {:else}
                  <Pagination.Item>
                    <Pagination.Link isActive={currentPage == p.value} page={p}>
                      {p.value}
                    </Pagination.Link>
                  </Pagination.Item>
                {/if}
              {/each}
              <Pagination.Item>
                <Pagination.NextButton />
              </Pagination.Item>
            </Pagination.Content>
          {/snippet}
        </Pagination.Root>
      </div>
    {/if}
  {/if}
</div>

<!-- Global delete dialog (outside accordion to avoid nested button issues) -->
{#if mounted}
  <AlertDialog bind:open={showDeleteDialog}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete &ldquo;{deleteKey}&rdquo;?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete this key and all its translations across every locale. This action cannot be
          undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <form
          action="?/delete"
          method="POST"
          use:enhance={() => {
        return async ({ result }: { result: { type: string } }) => {
          if (result.type === 'success') {
            showDeleteDialog = false;
            goto('/admin/translations', { replaceState: true });
          }
        };
      }}
        >
          <input name="key" type="hidden" value={deleteKey} />
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" type="submit"
            >Delete</AlertDialogAction
          >
        </form>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
{/if}
