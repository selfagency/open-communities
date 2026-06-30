<script lang="ts">
import PageEditor from '$lib/components/admin/page-editor.svelte';
import { m } from '$lib/paraglide/messages';

// fallow-ignore-next-line unused-component-props
let { data } = $props();
</script>

<svelte:head>
  <title>{m.newPage()} &middot; {m.title()}</title>
</svelte:head>

<div class="mx-auto max-w-3xl pb-4">
  <div class="mb-4">
    <a class="text-muted-foreground text-sm underline-offset-4 hover:underline" href="/admin/pages"
      >&larr; {m.pages()}</a
    >
  </div>

  <h1 class="text-2xl font-semibold mb-6">{m.newPage()}</h1>

  <PageEditor action="?/save" />
</div>
