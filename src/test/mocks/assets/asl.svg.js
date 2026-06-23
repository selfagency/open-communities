// Re-export a tiny Svelte component so imports of `asl.svg?component` yield
// a real component instance in the Vitest browser runner. The companion
// file `asl.svelte` lives next to this mock and is a minimal SVG component.
const markup = `<svg data-testid="mock-asl" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="none"/></svg>`;

/** @param {any} options */
function AslComponent(options) {
  // Handle both `new AslComponent()` and `AslComponent()` calls
  if (!(this instanceof AslComponent)) {
    return new AslComponent(options);
  }

  const target = options?.target;
  const props = options?.props || {};
  if (target) {
    const container = document.createElement('div');
    container.innerHTML = markup;
    const node = container.firstElementChild;
    if (node) {
      if (props.class) node.setAttribute('class', String(props.class));
      if (props.size) {
        node.setAttribute('width', String(props.size));
        node.setAttribute('height', String(props.size));
      }
      target.appendChild(node);
      this._node = node;
    }
  }
}
AslComponent.$$render = () => markup;
AslComponent.prototype.$destroy = function () {
  this._node?.remove();
};

export default AslComponent;
export const AslIcon = AslComponent;
