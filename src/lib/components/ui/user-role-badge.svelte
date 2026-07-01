<script lang="ts">
interface Props {
  admin: boolean;
  verified: boolean;
}

let { admin, verified }: Props = $props();
</script>

<div class="flex gap-2">
  {#if admin}
    <span class="bg-primary/10 text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
      Admin
    </span>
  {:else}
    <span
      class="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    >
      User
    </span>
  {/if}
  {#if verified}
    <span
      class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    >
      Verified
    </span>
  {:else}
    <span
      class="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    >
      Unverified
    </span>
  {/if}
</div>
