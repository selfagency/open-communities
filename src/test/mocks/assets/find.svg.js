const markup = `<svg data-testid="mock-find" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="none"/></svg>`;

/** @param {any} options */
function FindComponent(options) {
  // Handle both `new FindComponent()` and `FindComponent()` calls
  if (!(this instanceof FindComponent)) {
    return new FindComponent(options);
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
FindComponent.$$render = () => markup;
FindComponent.prototype.$destroy = function () {
  if (this._node?.parentNode) this._node.parentNode.removeChild(this._node);
};

export default FindComponent;
export const Find = FindComponent;
