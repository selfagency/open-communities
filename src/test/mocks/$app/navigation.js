export function afterNavigate() {}

export function beforeNavigate() {}

// Minimal $app/navigation mock used by tests to satisfy imports from
// `@sveltejs/kit` virtual module. `goto` should return a resolved promise.
export async function goto() {
  return Promise.resolve();
}
export async function invalidate() {
  return Promise.resolve();
}

export function invalidateAll() {
  return;
}
