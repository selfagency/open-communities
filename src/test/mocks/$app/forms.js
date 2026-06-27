// Mock for $app/forms
// Provides the enhance action for SvelteKit form handling

// @ts-nocheck

export function enhance(_action, _options) {
  return (_node) => ({
    destroy() {
      // noop — form enhancement not needed in component tests
    }
  });
}
