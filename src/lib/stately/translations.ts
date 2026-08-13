import { defineStore } from '@selfagency/stately';

/**
 * Per-key edit state for the translations admin page.
 * Keyed by translation key → locale → edited value.
 */
export const useEditStateStore = defineStore('translations-edit', {
  actions: {
    /** Clear all edits. */
    clearAll() {
      this.entries = {};
    },

    /** Remove all edits for a given key. */
    resetEditState(key: string) {
      delete this.entries[key];
    },
    /**
     * Set a single locale value for a given key.
     * Triggers reactivity — Stately proxies handle deep mutation tracking.
     */
    setEditValue(key: string, locale: string, val: string) {
      if (!this.entries[key]) {
        this.entries[key] = {};
      }
      this.entries[key][locale] = val;
    }
  },
  getters: {
    /** Get a single locale value, falling back to an original value. */
    getEditValue: (state) => (key: string, locale: string, original: string) => state.entries[key]?.[locale] ?? original
  },
  state: () => ({
    entries: {} as Record<string, Record<string, string>>
  })
});
