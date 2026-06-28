<script lang="ts">
// accept any bound props (e.g., bind:open) and forward attributes
export const open: boolean = false;
// $$restProps is available so attributes passed to the component will be forwarded
</script>

<svelte:element this={"div"} {...$$restProps}>
  <slot />
</svelte:element>
