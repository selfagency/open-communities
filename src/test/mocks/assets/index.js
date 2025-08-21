// Generic mock exports for SVG ?component imports.
// Each SVG import like `import X from '$lib/assets/foo.svg?component'` will be
// resolved by the alias to this folder and Vite will import the matching file.
// Provide a default export that behaves like a Svelte component function.

function DummyComponent(props) {
	// Minimal Svelte component shim: return an object with $$render used by Svelte runtime
	return {
		$$render: () => `<!--svg-mock-->`
	};
}

export default DummyComponent;

// Also export named components for a few assets used directly in code
export { default as asl } from './asl.svg.js';
export { default as find } from './find.svg.js';
export { default as inclusive } from './inclusive.svg.js';
export { default as mask } from './mask.svg.js';
export { default as rabbis4ceasefire } from './rabbis4ceasefire.svg.js';

