<script lang="ts">
import FileUploadIcon from '@tabler/icons-svelte/icons/file-upload';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Button from '$lib/components/ui/button/index.js';

let {
  ref = $bindable(null),
  children,
  ...restProps
}: Button.Props & { children?: import('svelte').Snippet } = $props();
</script>

<Button.Root type="submit" variant="outline" bind:ref {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</Button.Root>
