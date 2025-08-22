const markup = `<svg data-testid="mock-inclusive" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="none"/></svg>`;

function InclusiveComponent(options) {
	// Handle both `new InclusiveComponent()` and `InclusiveComponent()` calls
	if (!(this instanceof InclusiveComponent)) {
		return new InclusiveComponent(options);
	}

	const target = options && options.target;
	const props = (options && options.props) || {};
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
InclusiveComponent.$$render = function () {
	return markup;
};
InclusiveComponent.prototype.$destroy = function () {
	if (this._node && this._node.parentNode) this._node.parentNode.removeChild(this._node);
};

export default InclusiveComponent;
export const Inclusive = InclusiveComponent;
