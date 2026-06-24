<script lang="ts">
  import { enhance } from '$app/forms';
  import { AlertDialog as AlertDialogRoot, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '$lib/components/ui/alert-dialog';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Switch } from '$lib/components/ui/switch';
  import { toast } from 'svelte-sonner';
  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import KeyRound from '@lucide/svelte/icons/key-round';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { goto } from '$app/navigation';

  let { data } = $props();

  const form = superForm(data.form, {
    validators: zodClient(),
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
          <Select>
            <SelectTrigger>
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
      <form method="POST" action="?/sendPasswordReset" use:enhance={() => ({ onresult: () => toast.success('Password reset email sent') })}>
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
      <AlertDialogRoot>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 class="mr-1 size-4" /> Delete User
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {data.user.name || data.user.email} and unlink their congregation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form method="POST" action="?/delete" use:enhance={() => ({ onresult: () => { toast.success('User deleted'); goto('/admin/users'); } })}>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialogRoot>
    </CardContent>
  </Card>
</div>
