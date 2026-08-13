<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLAnchorAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';

let {
  ref = $bindable(null),
  class: className,
  href,
  child,
  children,
  ...restProps
}: WithElementRef<HTMLAnchorAttributes> & {
  child?: Snippet<[{ props: HTMLAnchorAttributes }]>;
} = $props();

const attrs = $derived({
  class: cn('transition-colors hover:text-foreground', className),
  'data-slot': 'breadcrumb-link',
  href,
  ...restProps
});
</script>

{#if child}
  {@render child({ props: attrs })}
{:else}
  <!-- biome-ignore lint/a11y/useValidAnchor: bits-ui BreadcrumbLink may not have href (current page indicator) -->
  <a bind:this={ref} {...attrs}> {@render children?.()} </a>
{/if}
