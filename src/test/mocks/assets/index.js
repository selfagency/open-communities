// Generic mock exports for SVG ?component imports.
// Each SVG import like `import X from '$lib/assets/foo.svg?component'` will be
// resolved by the alias to this folder and Vite will import the matching file.
// Provide a default export that behaves like a Svelte component function.

import Empty from './EmptyIcon.svelte';

// Export a real Svelte component as the default fallback so imports that
// don't resolve to a specific mock file still receive a callable Svelte
// constructor (avoids `X is not a function` at runtime).
export default Empty && (Empty.default || Empty);

// Re-export named mocks backed by real Svelte stubs
export { default as asl } from './asl.svg.js';
export { default as find } from './find.svg.js';
export { default as inclusive } from './inclusive.svg.js';
export { default as mask } from './mask.svg.js';
export { default as rabbis4ceasefire } from './rabbis4ceasefire.svg.js';
export { default as tent } from './tent.svg.js';
