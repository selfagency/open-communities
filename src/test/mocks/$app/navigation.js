// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
export function afterNavigate() {}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
export function beforeNavigate() {}

// Minimal $app/navigation mock used by tests to satisfy imports from
// `@sveltejs/kit` virtual module. `goto` should return a resolved promise.
// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
export async function goto() {}
// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
export async function invalidate() {}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
export function invalidateAll() {}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
export async function resolve() {}
