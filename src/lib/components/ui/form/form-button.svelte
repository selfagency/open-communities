<script lang="ts">
// biome-ignore lint/performance/noNamespaceImport: shadcn namespace import pattern
import * as Button from '$lib/components/ui/button/index.js';

let { ref = $bindable(null), ...restProps }: Button.Props = $props();
</script>

<Button.Root type="submit" bind:ref {...restProps} />
