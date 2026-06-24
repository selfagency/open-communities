<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { m } from '$lib/paraglide/messages';

  let { data } = $props();

  const form = superForm(data.form, {
    onUpdated({ form: f }) {
      if (f.valid) toast.success('Profile updated');
    },
  });
  const { form: formData, errors } = form;

  let deleting = $state(false);
  let unlinked = $state(false);
</script>

<svelte:head>
  <title>Account &middot; {m.title()}</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-8 py-8">
  <div>
    <h1 class="text-2xl font-semibold">Account</h1>
    <p class="text-muted-foreground text-sm">Manage your profile and preferences</p>
  </div>

  {#if false}
    <div class="bg-primary/10 text-primary rounded-lg border p-4 text-sm">Profile updated successfully.</div>
  {/if}
  {#if unlinked}
    <div class="bg-primary/10 text-primary rounded-lg border p-4 text-sm">You have been unlinked from your congregation.</div>
  {/if}

  <form method="POST" action="?/update" use:enhance>
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Profile</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Name</Label>
          <Input id="name" name="name" bind:value={$formData.name} required />
          {#if $errors.name}<p class="text-destructive text-xs">{$errors.name}</p>{/if}
        </div>
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" name="email" bind:value={$formData.email} type="email" required />
          {#if $errors.email}<p class="text-destructive text-xs">{$errors.email}</p>{/if}
        </div>
        <div class="space-y-2">
          <Label for="lang">Language</Label>
          <select id="lang" name="lang" bind:value={$formData.lang} class="border-input h-11 w-full rounded-md border bg-transparent px-3 text-sm">
            <option value="en">English</option>
            <option value="es">Espa&ntilde;ol</option>
            <option value="fr">Fran&ccedil;ais</option>
            <option value="he">עברית</option>
          </select>
        </div>
        <div class="flex items-center gap-3">
          <Switch id="notifications" checked={$formData.notifications} onCheckedChange={(c) => $formData.notifications = c} />
          <Label for="notifications" class="text-sm">Receive non-transactional email updates</Label>
        </div>
        {#if $errors._errors?.length}
          <p class="text-destructive text-xs">{$errors._errors.join(', ')}</p>
        {/if}
        <Button type="submit">Save Changes</Button>
      </CardContent>
    </Card>
  </form>

  <!-- Change password (always visible) -->
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Change Password</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <form method="POST" action="?/update" use:enhance>
        <input type="hidden" name="name" value={$formData.name} />
        <input type="hidden" name="email" value={$formData.email} />
        <input type="hidden" name="lang" value={$formData.lang} />
        <input type="hidden" name="notifications" value={String($formData.notifications)} />
        <div class="space-y-2">
          <Label for="oldPassword">Current Password</Label>
          <Input id="oldPassword" name="oldPassword" type="password" />
        </div>
        <div class="space-y-2">
          <Label for="password">New Password</Label>
          <Input id="password" name="password" type="password" />
        </div>
        <div class="space-y-2">
          <Label for="passwordConfirm">Confirm New Password</Label>
          <Input id="passwordConfirm" name="passwordConfirm" type="password" />
        </div>
        <Button type="submit">Change Password</Button>
      </form>
    </CardContent>
  </Card>

  <!-- Congregation -->
  {#if data.user?.congregation}
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Congregation</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-muted-foreground text-sm">You are linked to a congregation. You can unlink to manage a different one.</p>
        <form method="POST" action="?/unlink" use:enhance={() => { return async ({ result }) => { if (result.type === 'success') unlinked = true; }; }}>
          <Button variant="outline" type="submit">Unlink from Congregation</Button>
        </form>
        <Button variant="outline" onclick={() => goto('/edit?id=' + data.user?.congregation)}>Edit Congregation</Button>
      </CardContent>
    </Card>
  {/if}

  <!-- Danger zone -->
  <Card>
    <CardHeader>
      <CardTitle class="text-lg text-destructive">Danger Zone</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-muted-foreground text-sm">Permanently delete your account and all associated data.</p>
      <form method="POST" action="?/deleteAccount" use:enhance={() => {
        deleting = true;
        return async ({ result }) => { if (result.type === 'success') goto('/'); };
      }}>
        <Button variant="destructive" type="submit" disabled={deleting} onclick={() => confirm('Are you sure? This cannot be undone.')}>
          {deleting ? 'Deleting...' : 'Delete Account'}
        </Button>
      </form>
    </CardContent>
  </Card>
</div>
