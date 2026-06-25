<script lang="ts" module>
import { tv } from 'tailwind-variants';
import { cn } from '$lib/utils.js';

export const navigationMenuTriggerStyle = tv({
  base: 'group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 font-medium text-sm outline-none transition-all hover:bg-muted focus:bg-muted focus-visible:outline-1 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-open:bg-muted/50 data-popup-open:bg-muted/50 data-open:focus:bg-muted data-open:hover:bg-muted data-popup-open:hover:bg-muted'
});
</script>

<script lang="ts">
import ChevronDownIcon from '@tabler/icons-svelte/icons/chevron-down';
import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';

let {
  ref = $bindable(null),
  class: className,
  children,
  ...restProps
}: NavigationMenuPrimitive.TriggerProps = $props();
</script>

<NavigationMenuPrimitive.Trigger
  bind:ref
  data-slot="navigation-menu-trigger"
  class={cn(navigationMenuTriggerStyle(), "group", className)}
  {...restProps}
>
  {@render children?.()}
  <ChevronDownIcon
    class="relative top-px ml-1 size-3 transition duration-300 group-data-open/navigation-menu-trigger:rotate-180 group-data-popup-open/navigation-menu-trigger:rotate-180"
    aria-hidden="true"
  />
</NavigationMenuPrimitive.Trigger>
