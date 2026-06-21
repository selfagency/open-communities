<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	// eslint-disable-next-line @typescript-eslint/no-unused-vars — used for Svelte prop type inference
	type $$Props = AlertDialogPrimitive.PortalProps;
</script>

<AlertDialogPrimitive.Portal {...$$restProps}>
  <slot />
</AlertDialogPrimitive.Portal>
