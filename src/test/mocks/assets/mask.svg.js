import Empty from './EmptyIcon.svelte';

const Comp = (Empty && (Empty.default || Empty));

export default Comp;
export { Comp as MaskIcon };
try { module.exports = Comp; module.exports.default = Comp; } catch (e) {}
