<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import type { SuperForm } from 'sveltekit-superforms';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Switch } from '$lib/components/ui/switch';

  let {
    form,
    saved,
  }: {
    form: ReturnType<typeof superForm>;
    saved: boolean;
  } = $props();

  const { form: formData, errors } = form;
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold">Profile</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    {#if saved}
      <div class="bg-primary/10 text-primary rounded-lg border p-4 text-sm">Profile updated successfully.</div>
    {/if}
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
      <Select type="single" bind:value={$formData.lang}>
        <SelectTrigger id="lang" class="w-full">
          {$formData.lang === 'en' ? 'English' : $formData.lang === 'es' ? 'Español' : $formData.lang === 'fr' ? 'Français' : $formData.lang === 'he' ? 'עברית' : $formData.lang}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="fr">Français</SelectItem>
          <SelectItem value="he">עברית</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="flex items-center gap-3">
      <Switch id="notifications" checked={$formData.notifications} onCheckedChange={(c) => $formData.notifications = c} />
      <Label for="notifications" class="text-sm">Receive non-transactional email updates</Label>
    </div>
    {#if $errors._errors?.length}
      <p class="text-destructive text-xs">{String($errors._errors)}</p>
    {/if}
    <Button type="submit">Save Changes</Button>
  </CardContent>
</Card>
