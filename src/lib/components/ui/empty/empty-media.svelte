<script lang="ts" module>
import { tv, type VariantProps } from 'tailwind-variants';

export const emptyMediaVariants = tv({
  base: 'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  defaultVariants: {
    variant: 'default'
  },
  variants: {
    variant: {
      default: 'bg-transparent',
      icon: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4"
    }
  }
});

export type EmptyMediaVariant = VariantProps<typeof emptyMediaVariants>['variant'];
</script>

<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import { cn, type WithElementRef } from '$lib/utils.js';

let {
  ref = $bindable(null),
  class: className,
  children,
  variant = 'default',
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { variant?: EmptyMediaVariant } = $props();
</script>

<div
  class={cn(emptyMediaVariants({ variant }), className)}
  data-slot="empty-icon"
  data-variant={variant}
  bind:this={ref}
  {...restProps}
>
  {@render children?.()}
</div>
