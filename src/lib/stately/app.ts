import { createLocalStorageAdapter, createMemoryStorageAdapter, defineStore } from '@selfagency/stately';
import { browser } from '$app/environment';

export type AppState = {
  form?: { hasErrors: boolean; success: boolean };
  isMobile: boolean;
  lang: string;
  loading: boolean;
  loadingSecondary: boolean;
  offsetHeight: number;
  offsetWidth: number;
  showIntro: boolean;
};

/**
 * Global application state store.
 *
 * Tracks UI states: loading spinners, form feedback, responsive dimensions,
 * locale, and intro status.
 *
 * Access from components:
 * ```ts
 * import { useAppStore } from '$lib/stately/app';
 * import { getStateManager } from '$lib/stately';
 *
 * const app = useAppStore(getStateManager());
 * // template: $app.loading
 * ```
 */
export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    form: undefined,
    isMobile: false,
    lang: 'en',
    loading: false,
    loadingSecondary: false,
    offsetHeight: 0,
    offsetWidth: 0,
    showIntro: true
  }),
  persist: browser
    ? {
        adapter: createLocalStorageAdapter(),
        key: 'stately:app',
        pick: ['lang', 'showIntro'],
        version: 1
      }
    : {
        adapter: createMemoryStorageAdapter(),
        key: 'stately:app',
        version: 1
      },
  actions: {
    /** Initialize from window dimensions and user preferences. Call ONCE on first browser boot. */
    init(userLang?: string) {
      this.form = { hasErrors: false, success: false };
      this.isMobile = window.innerWidth < 640;
      this.lang = userLang || this.lang || 'en'; // preserve persisted lang if no override
      this.loading = false;
      this.loadingSecondary = false;
      this.offsetHeight = window.innerHeight;
      this.offsetWidth = window.innerWidth;
      // Do NOT reset showIntro — it is persisted to localStorage and should
      // only be set false by the user dismissing the intro dialog, never reverted.
    },

    /**
     * Apply a partial update via direct mutation.
     * Mirrors the legacy `setState` API during migration.
     */
    setState(partial: Partial<AppState>) {
      for (const [key, value] of Object.entries(partial)) {
        if (this[key as keyof AppState] !== value) {
          (this as unknown as Record<string, unknown>)[key] = value;
        }
      }
    }
  }
});

export type AppStore = ReturnType<typeof useAppStore>;
