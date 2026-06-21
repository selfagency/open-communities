const markup = `<svg data-testid="mock-rabbis" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="none"/></svg>`;

/** @param {any} options */
function RabbisComponent(options) {
  // Handle both `new RabbisComponent()` and `RabbisComponent()` calls
  if (!(this instanceof RabbisComponent)) {
    return new RabbisComponent(options);
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
RabbisComponent.$$render = () => markup;
RabbisComponent.prototype.$destroy = function () {
  if (this._node?.parentNode) this._node.parentNode.removeChild(this._node);
};

export default RabbisComponent;
export const RabbisLogo = RabbisComponent;
