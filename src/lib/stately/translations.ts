import { defineStore } from '@selfagency/stately';

/**
 * Per-key edit state for the translations admin page.
 * Keyed by translation key → locale → edited value.
 */
export const useEditStateStore = defineStore('translations-edit', {
  state: () => ({
    entries: {} as Record<string, Record<string, string>>
  }),
  actions: {
    /**
     * Set a single locale value for a given key.
     * Triggers reactivity — Stately proxies handle deep mutation tracking.
     */
    setEditValue(key: string, locale: string, val: string) {
      if (!this.entries[key]) {
        this.entries[key] = {};
      }
      this.entries[key][locale] = val;
    },

    /** Remove all edits for a given key. */
    resetEditState(key: string) {
      delete this.entries[key];
    },

    /** Clear all edits. */
    clearAll() {
      this.entries = {};
    }
  },
  getters: {
    /** Get a single locale value, falling back to an original value. */
    getEditValue: (state) => (key: string, locale: string, original: string) => state.entries[key]?.[locale] ?? original
  }
});
