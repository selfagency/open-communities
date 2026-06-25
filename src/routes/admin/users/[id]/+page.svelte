<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { m } from '$lib/paraglide/messages';

  let { data } = $props();
  // svelte-ignore state_referenced_locally
const user = data.targetUser;
  // svelte-ignore state_referenced_locally
  let formError = $state('');
  let formSuccess = $state('');
  let selectedCong = $state('');

  function handleUpdate() {
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
    return async ({ result }: { result: { type: string } }) => {
      if (result.type === 'redirect') goto('/admin/users');
    };
  }
</script>

<svelte:head>
  <title>{user.name || user.email} &middot; {m.title()}</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6 pb-4 -mt-6">
  <div class="mb-4">
    <a href="/admin/users" class="text-muted-foreground text-sm underline-offset-4 hover:underline">&larr; {m.adminUsers()}</a>
  </div>

  <div>
    <h1 class="text-2xl font-semibold">{user.name || user.email}</h1>
    <p class="text-muted-foreground text-sm">{user.email} &middot; {user.admin ? m.admin() : m.user()} &middot; {user.verified ? m.verified() : m.unverified()}</p>
  </div>

  {#if formSuccess}
    <div class="bg-primary/10 text-primary rounded-lg border p-4 text-sm">{formSuccess}</div>
  {/if}
  {#if formError}
    <div class="bg-destructive/10 text-destructive rounded-lg border p-4 text-sm">{formError}</div>
  {/if}

  <form method="POST" action="?/update" use:enhance={handleUpdate}>
    <Card>
      <CardHeader>
        <CardTitle class="text-lg font-bold">{m.profile()}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <label for="name" class="text-sm font-medium">{m.name()}</label>
          <Input id="name" name="name" value={user.name} required />
        </div>
        <div class="space-y-2">
          <label for="email" class="text-sm font-medium">{m.email()}</label>
          <Input id="email" name="email" type="email" value={user.email} required />
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
          <Button variant="outline" onclick={() => goto('/edit?id=' + user.congregation)}>{m.editCongregation()}</Button>
          <form method="POST" action="?/unlink" use:enhance={handleUpdate}>
            <Button variant="outline" type="submit">{m.unlinkFromCongregation()}</Button>
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
          <form method="POST" action="?/assign" use:enhance={handleUpdate}>
            <div class="flex gap-2">
              <select name="congregationId" bind:value={selectedCong} class="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">{m.selectCongregation()}</option>
                {#each data.availableCongregations as cong (cong.id)}
                  <option value={cong.id}>{cong.name}</option>
                {/each}
              </select>
              <Button variant="default" type="submit" disabled={!selectedCong}>{m.assign()}</Button>
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
      <form method="POST" action="?/resetPassword" use:enhance={handleUpdate}>
        <Button variant="outline" type="submit">{m.resetPasswordEmail()}</Button>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="text-lg font-bold text-destructive">{m.dangerZone()}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-muted-foreground text-sm">{m.deleteAccountDescription()}</p>
      <form method="POST" action="?/deleteAccount" use:enhance={handleDelete}>
        <Button variant="destructive" type="submit">{m.deleteAccount()}</Button>
      </form>
    </CardContent>
  </Card>
</div>
