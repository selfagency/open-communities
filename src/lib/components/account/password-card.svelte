<script lang="ts">
import FileUploadIcon from '@tabler/icons-svelte/icons/file-upload';
import type { SuperForm } from 'sveltekit-superforms';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Form from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import { m } from '$lib/paraglide/messages';

let {
  form
}: {
  form: SuperForm<any>;
} = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold">{m.changePassword()}</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <Form.Field {form} name="oldPassword">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="oldPassword">{m.currentPassword()}</Form.Label>
          <Input {...props} autocomplete="current-password" id="oldPassword" name="oldPassword" type="password" />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="password">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="password">{m.newPassword()}</Form.Label>
          <Input {...props} autocomplete="new-password" id="password" name="password" type="password" />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="passwordConfirm">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="passwordConfirm">{m.confirmPassword()}</Form.Label>
          <Input {...props} autocomplete="new-password" id="passwordConfirm" name="passwordConfirm" type="password" />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Button type="submit" variant="outline"><FileUploadIcon class="mr-1.5 size-4" />{m.changePassword()}</Button>
  </CardContent>
</Card>
