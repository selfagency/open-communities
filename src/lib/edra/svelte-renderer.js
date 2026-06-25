import { flushSync, mount, unmount } from 'svelte';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class SvelteRenderer {
    id;
    component;
    editor;
    props;
    element;
    ref = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mnt = null;
    constructor(component, { props, editor }) {
        this.id = Math.floor(Math.random() * 0xffffffff).toString();
        this.component = component;
        this.props = props;
        this.editor = editor;
        this.element = document.createElement('div');
        this.element.classList.add('svelte-renderer');
        if (this.editor.isInitialized) {
            // On first render, we need to flush the render synchronously
            // Renders afterwards can be async, but this fixes a cursor positioning issue
            flushSync(() => {
                this.render();
            });
        }
        else {
            this.render();
        }
    }
    render() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.mnt = mount(this.component, {
            target: this.element,
            props: {
                props: this.props
            }
        });
    }
    updateProps(props) {
        Object.assign(this.props, props);
        this.destroy();
        this.render();
    }
    updateAttributes(attributes) {
        Object.keys(attributes).forEach((key) => {
            this.element.setAttribute(key, attributes[key]);
        });
        this.destroy();
        this.render();
    }
    destroy() {
        if (this.mnt) {
            unmount(this.mnt);
        }
        else {
            unmount(this.component);
        }
    }
}
export default SvelteRenderer;
