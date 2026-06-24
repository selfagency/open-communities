<script lang="ts">
  import type { SuperForm, superForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Form from '$lib/components/ui/form';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import { Switch } from '$lib/components/ui/switch';

  let {
    form,
    saved,
  }: {
    form: ReturnType<typeof superForm>;
    saved: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  // Intentional: form is initialized once from server data (not reactive to prop changes)
  const { form: formData, errors } = form;
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold">Profile</CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    {#if saved}
      <div class="bg-primary/10 text-primary rounded-lg border p-4 text-sm">Profile updated successfully.</div>
    {/if}

    <Form.Field {form} name="name">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="name">Name</Form.Label>
          <Input {...props} id="name" name="name" bind:value={$formData.name as string} required />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="email">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="email">Email</Form.Label>
          <Input {...props} id="email" name="email" bind:value={$formData.email as string} type="email" required />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="lang">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="lang">Language</Form.Label>
          <Select.Root type="single" bind:value={$formData.lang as string}>
            <Select.Trigger id="lang" class="w-full" {...props}>
              {$formData.lang === 'en' ? 'English' : $formData.lang === 'es' ? 'Español' : $formData.lang === 'fr' ? 'Français' : $formData.lang === 'he' ? 'עברית' : $formData.lang}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="en">English</Select.Item>
              <Select.Item value="es">Español</Select.Item>
              <Select.Item value="fr">Français</Select.Item>
              <Select.Item value="he">עברית</Select.Item>
            </Select.Content>
          </Select.Root>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="notifications">
      <Form.Control>
        {#snippet children(props)}
          <div class="flex items-center gap-3">
            <Switch {...props} id="notifications" checked={$formData.notifications as unknown as boolean} onCheckedChange={(c) => $formData.notifications = c} />
            <Form.Label for="notifications" class="text-sm">Receive non-transactional email updates</Form.Label>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    {#if $errors._errors?.length}
      <p class="text-destructive text-xs">{String(($errors as any)._errors ?? "")}</p>
    {/if}

    <Button type="submit">Save Changes</Button>
  </CardContent>
</Card>
