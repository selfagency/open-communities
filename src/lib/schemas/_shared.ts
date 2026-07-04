/**
 * Lazy message helper — defers m.xxx() evaluation to avoid
 * SvelteKit post-build analysis crashes when paraglide isn't initialized.
 */
export function Lazy(fn: () => string): string {
  try {
    return fn();
  } catch {
    return '';
  }
}
