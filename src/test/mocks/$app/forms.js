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

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
export async function applyAction() {}

export function deserialize() {
  return {};
}
