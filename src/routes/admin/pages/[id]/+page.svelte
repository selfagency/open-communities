<script lang="ts">
import PageEditor from '$lib/components/admin/page-editor.svelte';
import { m } from '$lib/paraglide/messages';

let { data } = $props();
</script>

<svelte:head>
  <title>{m.editThing({ thing: data.page.title as string })} &middot; {m.title()}</title>
</svelte:head>

<div class="mx-auto max-w-3xl pb-4">
  <div class="mb-4">
    <a class="text-muted-foreground text-sm underline-offset-4 hover:underline" href="/admin/pages"
      >&larr; {m.pages()}</a
    >
  </div>

  <PageEditor action="?/save" page={data.page} />
</div>
