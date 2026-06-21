<script lang="ts">
  import { Select as SelectPrimitive } from 'bits-ui';

  // eslint-disable-next-line svelte/no-useless-assignment -- bindable ref
  let { ref = $bindable(null), ...restProps }: SelectPrimitive.GroupProps = $props();
</script>

<SelectPrimitive.Group data-slot="select-group" {...restProps} />
