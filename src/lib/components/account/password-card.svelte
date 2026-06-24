<script lang="ts">
  import type { SuperForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Form from '$lib/components/ui/form';
  import { Input } from '$lib/components/ui/input';

  let {
    form,
  }: {
    form: SuperForm<any>;
  } = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold">Change Password</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <Form.Field {form} name="oldPassword">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="oldPassword">Current Password</Form.Label>
          <Input {...props} id="oldPassword" name="oldPassword" type="password" autocomplete="current-password" />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="password">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="password">New Password</Form.Label>
          <Input {...props} id="password" name="password" type="password" autocomplete="new-password" />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="passwordConfirm">
      <Form.Control>
        {#snippet children(props)}
          <Form.Label for="passwordConfirm">Confirm New Password</Form.Label>
          <Input {...props} id="passwordConfirm" name="passwordConfirm" type="password" autocomplete="new-password" />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>

    <Button type="submit">Change Password</Button>
  </CardContent>
</Card>
