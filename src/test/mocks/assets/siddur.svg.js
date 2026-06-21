const markup = `<svg data-testid="mock-siddur" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="none"/></svg>`;

/** @param {any} options */
function SiddurComponent(options) {
  // Handle both `new SiddurComponent()` and `SiddurComponent()` calls
  if (!(this instanceof SiddurComponent)) {
    return new SiddurComponent(options);
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
SiddurComponent.$$render = () => markup;
SiddurComponent.prototype.$destroy = function () {
  if (this._node?.parentNode) this._node.parentNode.removeChild(this._node);
};

export default SiddurComponent;
export const SiddurIcon = SiddurComponent;
