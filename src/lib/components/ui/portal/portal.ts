// SSR-safe dynamic wrapper for the Portal component.
// Avoids top-level require that can break svelte-check when the package
// isn't installed in some CI environments. Consumers should call `getPortal()`
// and handle the undefined case during SSR.

export function getPortal(): Promise<unknown | undefined> {
  if (typeof globalThis.window === 'undefined') {
    return Promise.resolve(undefined);
  }

  // Dynamic import in the browser-only path. Use a literal module specifier so
  // the bundler can statically analyze and code-split the dependency while the
  // runtime guard still prevents server-side resolution.
  // The dynamic import may resolve to a module without a typed Portal export;
  // narrow at runtime and return undefined on any failure.
  return import('@jsrob/svelte-portal').then((m: any) => (m?.Portal ? m.Portal : undefined)).catch(() => undefined);
}

export default getPortal;
