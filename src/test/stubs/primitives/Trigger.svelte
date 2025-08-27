<script lang="ts">
  // simple button wrapper used for Sheet.Trigger in tests
  export let type: string = 'button';
  export let ariaExpanded: boolean | string | undefined;
  export let ariaHaspopup: boolean | string | undefined;
  export let id: string | undefined;
  export let className: string | undefined;
</script>

<button
  type={type as 'button'}
  {id}
  aria-expanded={ariaExpanded as boolean}
  aria-haspopup={ariaHaspopup as boolean}
  class={className}
  {...$$restProps}>
  <slot />
</button>
