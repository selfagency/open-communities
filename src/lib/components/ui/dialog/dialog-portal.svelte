<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for Svelte prop type inference
  type $$Props = DialogPrimitive.PortalProps;
</script>

<DialogPrimitive.Portal {...$$restProps}>
  <slot />
</DialogPrimitive.Portal>
