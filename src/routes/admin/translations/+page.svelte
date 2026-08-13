<script lang="ts">
import { createStateManager } from '@selfagency/stately';
import AlertCircleIcon from '@tabler/icons-svelte/icons/alert-circle';
import CancelIcon from '@tabler/icons-svelte/icons/cancel';
import CircleCheckIcon from '@tabler/icons-svelte/icons/circle-check';
import CirclePlusIcon from '@tabler/icons-svelte/icons/circle-plus';
import CircleXIcon from '@tabler/icons-svelte/icons/circle-x';
import FileUploadIcon from '@tabler/icons-svelte/icons/file-upload';
import LanguageIcon from '@tabler/icons-svelte/icons/language';
import LoadingIcon from '@tabler/icons-svelte/icons/loader';
import RefreshIcon from '@tabler/icons-svelte/icons/refresh';
import TrashIcon from '@tabler/icons-svelte/icons/trash';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';
import { browser } from '$app/environment';
import { deserialize, enhance } from '$app/forms';
import { goto, invalidateAll } from '$app/navigation';
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
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as HoverCard from '$lib/components/ui/hover-card/index.js';
import { Input } from '$lib/components/ui/input';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Pagination from '$lib/components/ui/pagination';
import { Progress } from '$lib/components/ui/progress/index.js';
import { Textarea } from '$lib/components/ui/textarea';
import { m } from '$lib/paraglide/messages';
import { useEditStateStore } from '$lib/stately/translations';
import type { addSchema } from './_shared';

let { data } = $props();

// Add form (superForm)
// svelte-ignore state_referenced_locally
const addSf = superForm(data.addForm, {
  dataType: 'json',
  id: 'add',
  onResult({ result }) {
    if (result.type === 'success' && result.data?.key) {
      showAddDialog = false;
      toast.success('Key created');
      const newKey = result.data.key as string;
      const params = new URLSearchParams();
      params.set('page', '1');
      goto(`/admin/translations?${params}`, { replaceState: true });
      setTimeout(() => {
        openKey = newKey;
      }, 500);
    } else if (result.type === 'failure') {
      toast.error((result.data?.error as string) ?? 'Failed to create key');
    } else {
      toast.error('An error occurred while creating key');
    }
  }
});

const addFormEnhance: any = addSf.enhance;
// svelte-ignore state_referenced_locally

// svelte-ignore state_referenced_locally
// Build a stable list of locales to render:
// - prefer server-provided locales when present
// - ensure 'en' appears first
// - include canonical supported locales so admins can create missing locales
const SUPPORTED_LOCALES = ['de', 'en', 'es', 'fr', 'he', 'hu', 'pt', 'ru', 'uk'] as const;
// svelte-ignore state_referenced_locally
const serverLocales = (data.locales ?? []) as string[];
// Build locales as a plain string[] to avoid mixing literal union types with
// runtime strings (which causes TS errors when spreading typed tuples).
const supportedAsStrings = SUPPORTED_LOCALES as readonly string[];
const defaultLocales = supportedAsStrings.filter((l) => l !== 'en');
const extraLocales = serverLocales.filter((l) => l !== 'en' && !supportedAsStrings.includes(l));
const locales: string[] = Array.from(new Set(['en', ...defaultLocales, ...extraLocales]));

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
    goto(`/admin/translations?${params}`, { keepFocus: true, replaceState: true });
  }, 300);
}

// Pagination
// svelte-ignore state_referenced_locally
let currentPage = $state(data.pagination.page);

function onPageChange(p: number) {
  currentPage = p;
  const params = new URLSearchParams($page.url.searchParams);
  params.set('page', String(p));
  goto(`/admin/translations?${params}`, { keepFocus: true, replaceState: true });
}

// Accordion — track which key is open
let openKey = $state('');
let mounted = $state(false);

$effect(() => {
  mounted = true;
});

// Debug helper: show server-returned locales & counts when ?debug=true is present
let debugMode = $state(false);
$effect(() => {
  try {
    debugMode = $page.url.searchParams.get('debug') === 'true';
  } catch {
    debugMode = false;
  }
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
// Uses Stately for reliable deep-mutation reactivity. Create manager only in browser
let editStateManager: ReturnType<typeof createStateManager> | null = null;
let editStateStore: ReturnType<typeof useEditStateStore> | null = null;

// Manual snapshot of Stately entries used by the template. Keep a shallow
// copy so Svelte sees a new object reference when Stately mutates deep values.
let editEntries = $state<Record<string, Record<string, string>>>({});

if (browser) {
  editStateManager = createStateManager();
  editStateStore = useEditStateStore(editStateManager);
  // initialize snapshot so SSR->browser mount shows current edits
  try {
    editEntries = { ...(editStateStore?.entries ?? {}) };
  } catch {
    /* ignore - best-effort */
  }
}

function getEditValue(key: string, locale: string, original: string): string {
  return editEntries[key]?.[locale] ?? original;
}

function setEditValue(key: string, locale: string, val: string) {
  if (editStateStore) {
    editStateStore.setEditValue(key, locale, val);
    // refresh snapshot so Svelte templates update
    try {
      editEntries = { ...(editStateStore.entries ?? {}) };
    } catch {
      /* ignore - best-effort */
    }
  }
}

function resetEditState(key: string) {
  if (editStateStore) {
    editStateStore.resetEditState(key);
    try {
      editEntries = { ...(editStateStore.entries ?? {}) };
    } catch {
      /* ignore - best-effort */
    }
  }
}

function buildEntries(key: string, entries: Array<{ locale: string; value: string; id?: string }>) {
  const seen = new Set<string>();
  const result = entries.map((e) => {
    seen.add(e.locale);
    return {
      id: e.id,
      locale: e.locale,
      value: editEntries[key]?.[e.locale] ?? e.value
    };
  });

  // Append locales added via editEntries (e.g. from auto-translate) that
  // aren't in the original entries, so they get created on save
  const edits = editEntries[key];
  if (edits) {
    for (const [locale, val] of Object.entries(edits)) {
      if (!seen.has(locale) && val) {
        result.push({ id: undefined, locale, value: val });
      }
    }
  }

  return result;
}

async function parseActionResponse(res: Response) {
  let body: any;
  try {
    body = await res.json();
  } catch {
    const text = await res.text();
    try {
      body = deserialize(text);
    } catch {
      body = null;
    }
  }
  let actionData: any = body?.data ?? body;
  // If the actionData is a devalue-serialized string, attempt to deserialize it
  if (typeof actionData === 'string') {
    // Common server shapes:
    // - devalue string (SvelteKit forms devalue) — try deserialize first
    // - JSON string (JSON.stringify on the server) — fallback to JSON.parse
    try {
      actionData = deserialize(actionData);
    } catch {
      try {
        actionData = JSON.parse(actionData);
      } catch {
        // leave as-is
      }
    }
  }
  // devtools: parseActionResponse result intentionally not persisted in prod
  return { actionData, body };
}

function applyTranslationsToEditState(key: string, translations: Array<{ locale: string; translatedText: string }>) {
  for (const t of translations) {
    // Debug: surface what we are writing into the edit store so we can verify
    // whether client-side application of translations actually occurs at runtime.
    // debug logging removed in cleanup; apply silently
    setEditValue(key, t.locale, t.translatedText);
  }
}

function extractTranslationsFromActionData(actionData: any): Array<{ locale: string; translatedText: string }> {
  const out: Array<{ locale: string; translatedText: string }> = [];
  if (!actionData) {
    return out;
  }

  // Resolve devalue-style numeric references inside arrays/objects to concrete values.
  function deepResolveArray(arr: any[]) {
    const cache = new Map<number, any>();
    const resolve = (v: any): any => {
      if (typeof v === 'number') {
        if (cache.has(v)) {
          return cache.get(v);
        }
        const ref = arr[v];
        cache.set(v, ref);
        const resolved = resolve(ref);
        cache.set(v, resolved);
        return resolved;
      }
      if (Array.isArray(v)) {
        return v.map(resolve);
      }
      if (v && typeof v === 'object') {
        const o: Record<string, any> = {};
        for (const k of Object.keys(v)) {
          o[k] = resolve(v[k]);
        }
        return o;
      }
      return v;
    };
    return arr.map(resolve);
  }

  function normalizeToArray(input: any): any[] | null {
    if (Array.isArray(input)) {
      return input as any[];
    }
    if (Array.isArray(input?.translations)) {
      return input.translations as any[];
    }
    return null;
  }

  function extractPairsFromArray(arr: any[]): Array<{ locale: string; translatedText: string }> {
    const supported = new Set(['de', 'en', 'es', 'fr', 'he', 'hu', 'pt', 'ru', 'uk']);
    const results: Array<{ locale: string; translatedText: string }> = [];

    const pushUnique = (locale: string, text: string) => {
      if (!supported.has(locale)) {
        return;
      }
      if (results.some((r) => r.locale === locale)) {
        return;
      }
      results.push({ locale, translatedText: text });
    };

    const handleObjectEntry = (v: any): boolean => {
      if (!(v && typeof v === 'object' && 'locale' in v && 'translatedText' in v)) {
        return false;
      }
      const localeRaw = (v as any).locale;
      const textRaw = (v as any).translatedText;
      const resolvedLocale = typeof localeRaw === 'number' ? String(arr[localeRaw]) : String(localeRaw);
      const resolvedText = typeof textRaw === 'number' ? String(arr[textRaw]) : String(textRaw);
      pushUnique(resolvedLocale, resolvedText);
      return true;
    };

    const handleSequenceEntry = (i: number): number => {
      const v = arr[i];
      if (typeof v === 'string' && supported.has(v) && i + 1 < arr.length && typeof arr[i + 1] === 'string') {
        pushUnique(v, String(arr[i + 1]));
        return 1; // consumed one additional index
      }
      return 0;
    };

    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (handleObjectEntry(v)) {
        continue;
      }
      const consumed = handleSequenceEntry(i);
      if (consumed) {
        i += consumed;
      }
    }

    return results;
  }

  // Work on a local variable to avoid parameter mutation warnings
  let translationData: any = actionData;

  const normalizedArray = normalizeToArray(translationData);
  if (normalizedArray) {
    try {
      translationData = deepResolveArray(normalizedArray);
    } catch {
      // best-effort: leave data unchanged on failure
    }
  }

  if (Array.isArray(translationData?.translations)) {
    translationData = translationData.translations;
  }

  if (Array.isArray(translationData)) {
    return extractPairsFromArray(translationData);
  }

  if (typeof translationData === 'object') {
    for (const k of Object.keys(translationData)) {
      const val = translationData[k];
      if (val && typeof val === 'string') {
        out.push({ locale: k, translatedText: val });
      }
    }
  }

  return out;
}

// Auto-translate state
let translating = $state<Record<string, boolean>>({});

function hasAlerts(
  key: string,
  entries: Array<{ locale: string; value: string }>,
  entriesMap: Record<string, Record<string, string>>
): boolean {
  const enValue = entriesMap[key]?.en ?? entries.find((e) => e.locale === 'en')?.value ?? '';
  if (!enValue) {
    return false;
  }
  return entries.some((e) => {
    if (e.locale === 'en') {
      return false;
    }
    const val = entriesMap[key]?.[e.locale] ?? e.value;
    return !val || val === enValue;
  });
}

async function handleAutoTranslate(key: string, text: string) {
  if (translating[key] || !text) {
    return;
  }

  if (debugMode) {
    toast.info('Translate handler invoked');
  }

  translating[key] = true;
  const nonEnglishLocales = locales.filter((l) => l !== 'en');
  if (!nonEnglishLocales.length) {
    translating[key] = false;
    return;
  }

  const form = new FormData();
  form.set('text', text);
  form.set('locales', JSON.stringify(nonEnglishLocales));

  try {
    const res = await fetch('?/translate', {
      body: form,
      headers: {
        Accept: 'application/json',
        'x-sveltekit-action': 'true'
      },
      method: 'POST'
    });

    const { body, actionData } = await parseActionResponse(res);

    if (body?.type === 'failure' || !res.ok || actionData?.error) {
      const err = actionData?.error ?? 'Translation failed';
      const msg = typeof err === 'string' ? err : (err?.message ?? JSON.stringify(err));
      toast.error(msg);
      return;
    }

    // Normalize a variety of translation payload shapes and apply
    const extracted = extractTranslationsFromActionData(actionData);
    if (extracted.length) {
      applyTranslationsToEditState(key, extracted);
      toast.success('Translations generated — review and save');
    }

    if (actionData?.errors?.length) {
      toast.warning(`${actionData.errors.length} locale(s) failed to translate`);
    }
  } catch (e) {
    const msg = e && typeof e === 'object' && (e as any).message ? (e as any).message : 'Translation request failed';
    toast.error(msg);
  } finally {
    delete translating[key];
    translating = { ...translating };
  }
}

// Redeploy state
let showWarning = $state(false);
let deploying = $state(false);
let deployStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
let deploymentUuid = $state<string | null>(null);
let deploymentStatus = $state<string | null>(null);
let deployError = $state<string | null>(null);
let pollTimer: ReturnType<typeof setInterval> | null = null;
let coolifyTimer: ReturnType<typeof setTimeout> | null = null;
let coolifyPhase = $state(false);

function startDeploy() {
  showWarning = false;
  deploying = true;
  deployStatus = 'loading';
  deployError = null;
  deploymentStatus = 'queued';
  coolifyPhase = false;
}

function pollStatus() {
  if (!deploymentUuid) {
    return;
  }
  pollTimer = setInterval(async () => {
    const form = new FormData();
    form.set('uuid', deploymentUuid ?? '');
    const res = await fetch('?/status', { body: form, method: 'POST' });
    const json = await res.json();
    if (json.status) {
      deploymentStatus = json.status;
      if (json.status === 'success' || json.status === 'failed' || json.status === 'cancelled') {
        if (pollTimer) {
          clearInterval(pollTimer);
        }
        if (json.status === 'success') {
          coolifyPhase = true;
          coolifyTimer = setTimeout(() => {
            coolifyPhase = false;
            deployStatus = 'success';
            deploying = false;
            window.location.reload();
          }, 30_000);
        } else {
          deployStatus = 'error';
          deploying = false;
        }
      }
    }
  }, 3000);
}

function handleEnhance() {
  // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
  return async ({ result }: { result: EnhanceResult }) => {
    if (result.type === 'success') {
      const d = result.data;
      if (d?.deploymentUuid) {
        deploymentUuid = d.deploymentUuid as string;
        pollStatus();
      }
      if (d?.error) {
        deployError = d.error as string;
        deploying = false;
        deployStatus = 'error';
      }
    } else {
      deployError = 'Deploy request failed';
      deploying = false;
      deployStatus = 'error';
    }
  };
}

function cancelDeploy() {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
  if (coolifyTimer) {
    clearTimeout(coolifyTimer);
  }
  deploying = false;
  deployStatus = 'idle';
  deploymentUuid = null;
  deploymentStatus = null;
  deployError = null;
  coolifyPhase = false;
}

interface EnhanceResult {
  data?: Record<string, unknown>;
  type: string;
}

function handleAdd() {
  return (opts: { result: EnhanceResult }) => {
    const { result } = opts;
    if (result.type === 'success' && result.data?.key) {
      showAddDialog = false;
      toast.success('Key created');
      const newKey = result.data.key as string;
      const params = new URLSearchParams();
      params.set('page', '1');
      goto(`/admin/translations?${params}`, { replaceState: true });
      setTimeout(() => {
        openKey = newKey;
      }, 500);
    } else if (result.type === 'failure') {
      toast.error((result.data?.error as string) ?? 'Failed to create key');
    } else {
      toast.error('An error occurred while creating key');
    }
  };
}

function handleSave(key: string) {
  return async (opts: { result: EnhanceResult }) => {
    const { result } = opts;
    if (result.type === 'success') {
      resetEditState(key);
      toast.success('Translations saved');
      await invalidateAll();
    } else if (result.type === 'failure') {
      toast.error((result.data?.error as string) ?? 'Failed to save translations');
    } else {
      toast.error('An error occurred while saving');
    }
  };
}

function handleDelete(key: string) {
  return (opts: { result: EnhanceResult }) => {
    const { result } = opts;
    if (result.type === 'success') {
      goto('/admin/translations', { replaceState: true });
      toast.success('Key deleted');
    } else if (result.type === 'failure') {
      toast.error((result.data?.error as string) ?? 'Failed to delete key');
    } else {
      toast.error('An error occurred while deleting');
    }
  };
}

function handleBulkDelete() {
  return (opts: { result: EnhanceResult }) => {
    const { result } = opts;
    if (result.type === 'success') {
      showDeleteDialog = false;
      goto('/admin/translations', { replaceState: true });
      toast.success('Key deleted');
    } else if (result.type === 'failure') {
      showDeleteDialog = false;
      toast.error((result.data?.error as string) ?? 'Failed to delete key');
    } else {
      showDeleteDialog = false;
      toast.error('An error occurred while deleting');
    }
  };
}

const statusLabels: Record<string, string> = {
  cancelled: 'Cancelled',
  failed: 'Failed',
  in_progress: 'Building...',
  queued: 'Queued',
  restarting: 'Restarting...',
  success: 'Deployed!'
};

const deployProgress = $derived(
  coolifyPhase
    ? 100
    : deploymentStatus === 'in_progress'
      ? 60
      : deploymentStatus === 'success'
        ? 100
        : deploymentStatus === 'failed'
          ? 100
          : 20
);
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
        <h2 class="flex items-center gap-2 text-2xl font-semibold">
          <LanguageIcon class="size-6" />
          {m.translations()}
        </h2>
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
            <HoverCard.Root>
              <HoverCard.Trigger>
                <Button variant="outline">
                  {#if deployStatus === 'loading'}
                    <LoadingIcon class="mr-1.5 size-4 animate-spin" />
                  {:else if deployStatus === 'success'}
                    <CircleCheckIcon class="mr-1.5 size-4 text-green-600" />
                  {:else if deployStatus === 'error'}
                    <CircleXIcon class="mr-1.5 size-4 text-destructive" />
                  {:else}
                    <RefreshIcon class="mr-1.5 size-4" />
                  {/if}
                  Rebuild
                </Button>
              </HoverCard.Trigger>
              {#if deploying || deployStatus !== 'idle'}
                <HoverCard.Content class="w-64">
                  <div class="space-y-2">
                    <p class="text-sm font-medium">
                      {statusLabels[deploymentStatus ?? 'queued'] ?? deploymentStatus}
                    </p>
                    <Progress value={deployProgress} />
                    {#if deployStatus === 'error' && deployError}
                      <p class="text-destructive text-xs">{deployError}</p>
                    {/if}
                  </div>
                </HoverCard.Content>
              {/if}
            </HoverCard.Root>
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
              <AlertDialogCancel><CancelIcon class="mr-1.5 size-4" />Cancel</AlertDialogCancel>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Translation Key</DialogTitle>
          <DialogDescription>Create a new translation key with an English value.</DialogDescription>
        </DialogHeader>
        <form action="?/add" method="POST" use:enhance={addFormEnhance}>
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
            <Button
              onclick={() => {
                showAddDialog = false;
              }}
              variant="outline"
              ><CancelIcon class="mr-1.5 size-4" />Cancel</Button
            >
            <Button type="submit" variant="outline"><FileUploadIcon class="mr-1.5 size-4" />Create</Button>
          </div>
        </form>
      </DialogContent>
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
    {#if debugMode}
      <div class="rounded border p-2 mb-3 bg-muted/5 text-xs">
        <div><strong>Debug</strong></div>
        <div>Locales: {JSON.stringify(locales)}</div>
        <div>Translations keys: {data.translations.length}</div>
        <div>Records returned: {data.recordsCount ?? 'n/a'}</div>
      </div>
    {/if}
    <Accordion bind:value={openKey}>
      {#each data.translations as { key, entries } (key)}
        {@const enEntry = entries.find((e: { locale: string }) => e.locale === 'en')}
        <AccordionItem value={key}>
          <AccordionTrigger>
            <span class="flex items-start gap-6 min-w-0 flex-1">
              <span class="font-mono text-sm font-medium leading-6 shrink-0 w-48 truncate">
                {key}
                {#if hasAlerts(key, entries, editEntries)}
                  <AlertCircleIcon class="inline size-4 text-amber-500 align-middle -mt-0.5 ml-1" />
                {/if}
              </span>
              <span class="text-muted-foreground truncate text-sm leading-6 flex-1 min-w-0">
                {enEntry?.value ?? ''}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <form action="?/save" class="space-y-3" method="POST" use:enhance={() => handleSave(key)}>
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
                    value={editEntries[key]?.[locale] ?? entry?.value ?? ''}
                  />
                </div>
              {/each}

              <div class="flex items-center justify-between gap-2 pt-2">
                <Button
                  class="h-11 gap-1.5 px-2.5"
                  disabled={translating[key] || !enEntry?.value}
                  onclick={(e) => {
                    e.stopPropagation();
                    handleAutoTranslate(key, getEditValue(key, 'en', enEntry?.value ?? ''));
                  }}
                  onpointerdown={(e) => e.stopPropagation()}
                  type="button"
                  variant="outline"
                >
                  {#if translating[key]}
                    <LoadingIcon class="mr-1.5 size-4 animate-spin" />
                    Translating
                  {:else}
                    <LanguageIcon class="mr-1.5 size-4" />
                    Translate
                  {/if}
                </Button>
                <div class="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button type="button" variant="destructive"><TrashIcon class="mr-1.5 size-4" /> Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{key}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this key and all its translations across every locale. This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel><CancelIcon class="mr-1.5 size-4" />Cancel</AlertDialogCancel>
                        <form action="?/delete" method="POST" use:enhance={() => handleDelete(key)}>
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
                  <Button type="submit" variant="outline"><FileUploadIcon class="mr-1.5 size-4" />Save</Button>
                </div>
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
        <AlertDialogCancel><CancelIcon class="mr-1.5 size-4" />Cancel</AlertDialogCancel>
        <form action="?/delete" method="POST" use:enhance={handleBulkDelete}>
          <input name="key" type="hidden" value={deleteKey} />
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" type="submit"
            >Delete</AlertDialogAction
          >
        </form>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
{/if}
