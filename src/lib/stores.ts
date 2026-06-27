import { createPersistencePlugin, createStateManager } from '@selfagency/stately';

import { browser } from '$app/environment';

import type { AppState, AppStore } from '$lib/stately/app';
import { useAppStore } from '$lib/stately/app';

export type { AppStore };

/* ------------------------------------------------------------------ */
/*  Manager singleton                                                  */
/* ------------------------------------------------------------------ */

const _manager = createStateManager().use(createPersistencePlugin());

function _getStore(): AppStore {
  return useAppStore(_manager);
}

const _defaultState: AppState = {
  form: { hasErrors: false, success: false },
  isMobile: false,
  lang: 'en',
  loading: false,
  loadingSecondary: false,
  offsetHeight: 0,
  offsetWidth: 0,
  showIntro: true
};

/**
 * App store instance — module-level singleton.
 *
 * During SSR, the store still initializes with default values and
 * a memory-backed persistence adapter (configured in the store definition),
 * so Svelte's `$store` auto-subscription returns valid defaults immediately.
 */
export const state: AppStore = _getStore();

/* ------------------------------------------------------------------ */
/*  Public helpers                                                     */
/* ------------------------------------------------------------------ */

/** Initialize from window dimensions and user preferences. Noop when server. */
export function initState(userLang?: string) {
  if (browser) {
    _getStore().init(userLang);
  }
}

/** Apply a partial state update. */
export function setState(partial: Partial<AppState>) {
  _getStore().setState(partial);
}
