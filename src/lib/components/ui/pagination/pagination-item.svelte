<script lang="ts">
import type { HTMLLiAttributes } from 'svelte/elements';

import type { WithElementRef } from '$lib/utils.js';

let { children, ref = $bindable(null), ...restProps }: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li data-slot="pagination-item" bind:this={ref} {...restProps}>
  {@render children?.()}
</li>
