// Minimal page store used by components in tests. Mirrors the in-test
// page store created in `src/test/setupTest.ts` so imports from
// `$app/state` resolve during Vite transform.
/** @type {any} */
let _userValue = null;
const _userSubscribers = new Set();
const userStore = {
  /** @param {any} next */
  set(next) {
    _userValue = next;
    for (const s of _userSubscribers) {
      s(_userValue);
    }
  },
  /** @param {(v: any) => void} fn */
  subscribe(fn) {
    _userSubscribers.add(fn);
    fn(_userValue);
    return () => _userSubscribers.delete(fn);
  },
  /** @param {(v: any) => any} updater */
  update(updater) {
    _userValue = updater(_userValue);
    for (const s of _userSubscribers) {
      s(_userValue);
    }
  }
};

const fakeSearchParams = {
  get() {
    return null;
  },
  has() {
    return false;
  }
};

export const page = {
  data: { user: userStore },
  /** @param {(v: any) => void} fn */
  subscribe(fn) {
    fn({ data: { user: userStore }, url: { searchParams: fakeSearchParams } });
    return () => {};
  },
  url: { searchParams: fakeSearchParams }
};
