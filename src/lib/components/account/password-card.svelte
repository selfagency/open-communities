<script lang="ts">
  import type { SuperForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let {
    formData,
    errors,
  }: {
    formData: { oldPassword?: string; password?: string; passwordConfirm?: string };
    errors: { oldPassword?: string; password?: string; passwordConfirm?: string; _errors?: string[] };
  } = $props();
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg font-bold">Change Password</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <div class="space-y-2">
      <Label for="oldPassword">Current Password</Label>
      <Input id="oldPassword" name="oldPassword" type="password" autocomplete="current-password" />
    </div>
    <div class="space-y-2">
      <Label for="password">New Password</Label>
      <Input id="password" name="password" type="password" autocomplete="new-password" />
    </div>
    <div class="space-y-2">
      <Label for="passwordConfirm">Confirm New Password</Label>
      <Input id="passwordConfirm" name="passwordConfirm" type="password" autocomplete="new-password" />
    </div>
    <Button type="submit">Change Password</Button>
  </CardContent>
</Card>
