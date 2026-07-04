<script lang="ts">
import FileUploadIcon from '@tabler/icons-svelte/icons/file-upload';
import type { SuperForm, superForm } from 'sveltekit-superforms';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Form from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Select from '$lib/components/ui/select';
import { Switch } from '$lib/components/ui/switch';
import { m } from '$lib/paraglide/messages';

let {
  form,
  saved
}: {
  form: ReturnType<typeof superForm>;
  saved: boolean;
} = $props();

// svelte-ignore state_referenced_locally
// Intentional: form is initialized once from server data (not reactive to prop changes)
const { form: formData, errors } = form;

function langName(lang: string): string {
  return lang === 'en'
    ? 'English'
    : lang === 'es'
      ? 'Español'
      : lang === 'fr'
        ? 'Français'
        : lang === 'he'
          ? 'עברית'
          : lang;
}
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold">{m.profile()}</CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    {#if saved}
      <div class="bg-primary/10 text-primary rounded-lg border p-4 text-sm">{m.updateSuccess()}</div>
    {/if}

    <Form.Field {form} name="name">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="name">{m.name()}</Form.Label>
          <Input {...props} id="name" name="name" required bind:value={$formData.name as string} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="email">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="email">{m.email()}</Form.Label>
          <Input {...props} id="email" name="email" required type="email" bind:value={$formData.email as string} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="lang">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="lang">{m.language()}</Form.Label>
          <Select.Root type="single" bind:value={$formData.lang as string}>
            <Select.Trigger class="w-full" id="lang" {...props}>
              {langName($formData.lang as string)}
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
            <Switch
              {...props}
              checked={$formData.notifications as unknown as boolean}
              id="notifications"
              onCheckedChange={(c) => $formData.notifications = c}
            />
            <Form.Label class="text-sm" for="notifications">{m.emailUpdates()}</Form.Label>
          </div>
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    {#if $errors._errors?.length}
      <p class="text-destructive text-xs">{String(($errors as any)._errors ?? "")}</p>
    {/if}

    <Button type="submit" variant="outline"><FileUploadIcon class="mr-1.5 size-4" />{m.saveChanges()}</Button>
  </CardContent>
</Card>
