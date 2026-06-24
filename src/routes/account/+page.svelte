<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { toast } from 'svelte-sonner';
  import ProfileForm from '$lib/components/account/profile-form.svelte';
  import PasswordCard from '$lib/components/account/password-card.svelte';
  import CongregationCard from '$lib/components/account/congregation-card.svelte';
  import DangerZone from '$lib/components/account/danger-zone.svelte';
  import { m } from '$lib/paraglide/messages';

  let { data } = $props();

  let saved = $state(false);
  let unlinked = $state(false);

  const form = superForm(data.form, {
    onUpdated({ form: f }) {
      saved = true;
      if (f.valid) toast.success('Profile updated');
    },
  });
  const { enhance, form: formData, errors } = form;

  function handleUnlink() {
    return async ({ result }: { result: { type: string } }) => {
      if (result.type === 'success') unlinked = true;
    };
  }

  function handleDelete() {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    return async ({ result }: { result: { type: string } }) => {
      if (result.type === 'success') window.location.href = '/';
    };
  }
</script>

<svelte:head>
  <title>Account &middot; {m.title()}</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-8 py-8">
  <div>
    <h1 class="text-2xl font-semibold">Account</h1>
    <p class="text-muted-foreground text-sm">Manage your profile and preferences</p>
  </div>

  {#if unlinked}
    <div class="bg-primary/10 text-primary rounded-lg border p-4 text-sm">You have been unlinked from your congregation.</div>
  {/if}

  <form method="POST" action="?/update" use:enhance>
    <ProfileForm {form} {saved} />
    <div class="mt-6">
      <PasswordCard formData={$formData} errors={$errors} />
    </div>
  </form>

  <CongregationCard congregation={data.user?.congregation ?? ''} onUnlink={handleUnlink} />
  <DangerZone onDelete={handleDelete} />
</div>
