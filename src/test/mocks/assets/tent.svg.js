const markup = `<svg data-testid="mock-tent" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="none"/></svg>`;

/** @param {any} options */
function TentComponent(options) {
  // Handle both `new TentComponent()` and `TentComponent()` calls
  if (!(this instanceof TentComponent)) {
    return new TentComponent(options);
  }

  const target = options?.target;
  const props = options?.props || {};
  if (target) {
    const container = document.createElement('div');
    container.innerHTML = markup;
    const node = container.firstElementChild;
    if (node) {
      if (props.class) {
        node.setAttribute('class', String(props.class));
      }
      if (props.size) {
        node.setAttribute('width', String(props.size));
        node.setAttribute('height', String(props.size));
      }
      target.appendChild(node);
      this._node = node;
    }
  }
}
TentComponent.$$render = () => markup;
TentComponent.prototype.$destroy = function () {
  this._node?.remove();
};

export default TentComponent;
export const Tent = TentComponent;
