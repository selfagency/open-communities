<script lang="ts">
import FileUploadIcon from '@tabler/icons-svelte/icons/file-upload';
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Button from '$lib/components/ui/button/index.js';

let { ref = $bindable(null), ...restProps }: Button.Props = $props();
</script>

<Button.Root type="submit" variant="outline" bind:ref {...restProps}
  ><FileUploadIcon class="mr-1.5 size-4" /></Button.Root
>
