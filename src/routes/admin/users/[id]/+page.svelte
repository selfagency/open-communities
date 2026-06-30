<script lang="ts">
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
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
import { Input } from '$lib/components/ui/input';
import { Switch } from '$lib/components/ui/switch';
import UserRoleBadge from '$lib/components/ui/user-role-badge.svelte';
import { m } from '$lib/paraglide/messages';

let { data } = $props();

// svelte-ignore state_referenced_locally
let verifiedToggle = $state(data.targetUser?.verified ?? false);
// svelte-ignore state_referenced_locally
let adminToggle = $state(data.targetUser?.admin ?? false);
// svelte-ignore state_referenced_locally
const user = data.targetUser;
let formError = $state('');
let formSuccess = $state('');
let selectedCong = $state('');
let showDeleteDialog = $state(false);

function handleUpdate() {
  // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
  return async ({ result }: { result: { type: string; data?: Record<string, unknown> } }) => {
    if (result.type === 'success') {
      formSuccess = (result.data?.success as string) ?? 'Saved';
      formError = '';
    } else {
      formError = (result.data?.error as string) ?? 'Error';
      formSuccess = '';
    }
  };
}

function handleDelete() {
  // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
  return async ({ result }: { result: { type: string } }) => {
    if (result.type === 'redirect') {
      goto('/admin/users');
    }
  };
}
</script>

<svelte:head>
  <title>{user.name || user.email} &middot; {m.title()}</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6 pb-4 -mt-6">
  <div class="mb-4">
    <a class="text-muted-foreground text-sm underline-offset-4 hover:underline" href="/admin/users"
      >&larr; {m.adminUsers()}</a
    >
  </div>

  <div>
    <h1 class="text-2xl font-semibold">{user.name || user.email}</h1>
    <p class="text-muted-foreground text-sm">
      {user.email}
      <UserRoleBadge admin={user.admin} verified={user.verified} />
    </p>
  </div>

  {#if formSuccess}
    <div class="bg-primary/10 text-primary rounded-lg border p-4 text-sm">{formSuccess}</div>
  {/if}
  {#if formError}
    <div class="bg-destructive/10 text-destructive rounded-lg border p-4 text-sm">{formError}</div>
  {/if}

  <form action="?/update" method="POST" use:enhance={handleUpdate}>
    <Card>
      <CardHeader>
        <CardTitle class="text-lg font-bold">{m.profile()}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium" for="name">{m.name()}</label>
          <Input id="name" name="name" required value={user.name} />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium" for="email">{m.email()}</label>
          <Input id="email" name="email" required type="email" value={user.email} />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium" for="verified">{m.verified()}</label>
          <Switch aria-label={m.verified()} id="verified" name="verified" bind:checked={verifiedToggle} />
          <input name="verified" type="hidden" value={String(verifiedToggle)} />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium" for="admin">{m.admin()}</label>
          <Switch aria-label={m.admin()} id="admin" name="admin" bind:checked={adminToggle} />
          <input name="admin" type="hidden" value={String(adminToggle)} />
        </div>
        <Button type="submit">{m.saveChanges()}</Button>
      </CardContent>
    </Card>
  </form>

  {#if user.congregation}
    <Card>
      <CardHeader>
        <CardTitle class="text-lg font-bold">{m.congregation()}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-muted-foreground text-sm">{m.linkedDescription()}</p>
        <div class="flex gap-2">
          <Button onclick={() => goto('/edit?id=' + user.congregation)} variant="outline"
            >{m.editCongregation()}</Button
          >
          <form action="?/unlink" method="POST" use:enhance={handleUpdate}>
            <Button type="submit" variant="outline">{m.unlinkFromCongregation()}</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle class="text-lg font-bold">{m.congregation()}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-muted-foreground text-sm">{m.noCongregationLinked()}</p>
        {#if data.availableCongregations.length > 0}
          <form action="?/assign" method="POST" use:enhance={handleUpdate}>
            <div class="flex gap-2">
              <select
                class="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                name="congregationId"
                bind:value={selectedCong}
              >
                <option value="">{m.selectCongregation()}</option>
                {#each data.availableCongregations as cong (cong.id)}
                  <option value={cong.id}>{cong.name}</option>
                {/each}
              </select>
              <Button disabled={!selectedCong} type="submit" variant="default">{m.assign()}</Button>
            </div>
          </form>
        {:else}
          <p class="text-muted-foreground text-xs">{m.noUnassignedCongregations()}</p>
        {/if}
      </CardContent>
    </Card>
  {/if}

  <Card>
    <CardHeader>
      <CardTitle class="text-lg font-bold">{m.changePassword()}</CardTitle>
    </CardHeader>
    <CardContent>
      <form action="?/resetPassword" method="POST" use:enhance={handleUpdate}>
        <Button type="submit" variant="outline">{m.resetPasswordEmail()}</Button>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="text-lg font-bold text-destructive">{m.dangerZone()}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-muted-foreground text-sm">{m.deleteAccountDescription()}</p>
      <AlertDialog bind:open={showDeleteDialog}>
        <AlertDialogTrigger>
          <Button type="button" variant="destructive">{m.deleteAccount()}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.deleteAccount()}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.deleteAccountDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action="?/deleteAccount" method="POST" use:enhance={handleDelete}>
              <AlertDialogAction
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                type="submit"
                >{m.deleteAccount()}</AlertDialogAction
              >
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>
  </Card>
</div>
