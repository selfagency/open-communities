<script lang="ts">
  import KeyRound from '@lucide/svelte/icons/key-round';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { toast } from 'svelte-sonner';
  import { superForm } from 'sveltekit-superforms';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Switch } from '$lib/components/ui/switch';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const form = superForm(data.form, {
    dataType: 'json',
    onUpdated: () => toast.success('User updated'),
  });
  const { form: formData, errors, enhance: formEnhance } = form;
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Edit User</h1>
    <Button variant="outline" onclick={() => goto('/admin/users')}>Back to Users</Button>
  </div>

  <form method="POST" use:formEnhance class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>User Details</CardTitle>
        <CardDescription>Edit user profile information.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Name</Label>
          <Input id="name" name="name" bind:value={$formData.name} />
        </div>

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" name="email" type="email" bind:value={$formData.email} />
          {#if $errors.email}<p class="text-sm text-destructive">{$errors.email}</p>{/if}
        </div>

        <div class="space-y-2">
          <Label for="lang">Language</Label>
          <Select type="single" bind:value={$formData.lang}>
            <SelectTrigger id="lang">
              <span>{$formData.lang || 'en'}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="he">עברית</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="hu">Magyar</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="uk">Українська</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <Switch id="admin" bind:checked={$formData.admin} />
            <Label for="admin">Admin</Label>
          </div>
          <div class="flex items-center gap-2">
            <Switch id="verified" bind:checked={$formData.verified} />
            <Label for="verified">Verified</Label>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="flex justify-end">
      <Button type="submit">Save Changes</Button>
    </div>
  </form>

  <Card>
    <CardHeader>
      <CardTitle>Password</CardTitle>
      <CardDescription>Send a password reset email to the user.</CardDescription>
    </CardHeader>
    <CardContent>
      <form method="POST" action="?/sendPasswordReset" use:enhance={() => {
        return async () => { toast.success('Password reset email sent'); };
      }}>
        <Button type="submit" variant="outline">
          <KeyRound class="mr-1 size-4" /> Send Password Reset
        </Button>
      </form>
    </CardContent>
  </Card>

  <Card class="border-destructive">
    <CardHeader>
      <CardTitle class="text-destructive">Danger Zone</CardTitle>
      <CardDescription>Permanently delete this user and unlink their congregation.</CardDescription>
    </CardHeader>
    <CardContent>
      <AlertDialog.Root>
        <AlertDialog.Trigger>
          {#snippet child({ props })}
            <Button variant="destructive" {...props}>
              <Trash2 class="mr-1 size-4" /> Delete User
            </Button>
          {/snippet}
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Are you sure?</AlertDialog.Title>
            <AlertDialog.Description>
              This will permanently delete {data.user.name || data.user.email} and unlink their congregation. This action cannot be undone.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <form method="POST" action="?/delete" use:enhance={() => {
            return async () => { toast.success('User deleted'); goto('/admin/users'); };
          }}>
            <AlertDialog.Footer>
              <AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
              <AlertDialog.Action type="submit" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialog.Action>
            </AlertDialog.Footer>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </CardContent>
  </Card>
</div>
