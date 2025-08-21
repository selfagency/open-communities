// Return the test user store created in setupTest.ts at runtime. We use a function
// so the store lookup happens after Vitest runs the setup file that initializes
// the global. Importing the store directly at module load time can be too early.
export function getUserStore() {
	// If setupTest hasn't initialized the global store for some reason,
	// create a minimal writable-like store so tests can proceed.
	if (!(globalThis as Record<string, unknown>).__TEST_USER_STORE__) {
		let _value: unknown = null;
		const subs = new Set<(v: unknown) => void>();
		const store = {
			set(next: unknown) {
				_value = next;
				for (const s of subs) s(_value);
			},
			subscribe(fn: (v: unknown) => void) {
				subs.add(fn);
				fn(_value);
				return () => subs.delete(fn);
			},
			update(updater: (v: unknown) => unknown) {
				_value = updater(_value);
				for (const s of subs) s(_value);
			}
		};
		(globalThis as Record<string, unknown>).__TEST_USER_STORE__ = store;
	}
	return (globalThis as Record<string, unknown>).__TEST_USER_STORE__;
}
