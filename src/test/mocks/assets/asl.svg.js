// Re-export a tiny Svelte component so imports of `asl.svg?component` yield
// a real component instance in the Vitest browser runner. The companion
// file `asl.svelte` lives next to this mock and is a minimal SVG component.
import AslComponentMod from './asl.svelte';

// Some bundlers wrap the Svelte component under a `.default` property.
// Normalize to the actual component constructor/function so imports like
// `import AslIcon from '...svg?component'` yield a callable component.
const AslComponent = (AslComponentMod && (AslComponentMod.default || AslComponentMod));

export default AslComponent;
export { AslComponent as AslIcon };

// CommonJS fallback
try {
	module.exports = AslComponent;
	module.exports.default = AslComponent;
} catch (e) {}
