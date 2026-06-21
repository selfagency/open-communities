import { createPersistencePlugin, createStateManager } from '@selfagency/stately';

/**
 * Creates a Stately state manager with the standard plugin set.
 *
 * Plugin set:
 * - `createPersistencePlugin()` — for stores that opt into localStorage persistence
 *
 * Call once per SSR request (via `initializeStateManagerContext`) or
 * once at app root for client-only usage.
 */
export function createManager() {
  return createStateManager().use(createPersistencePlugin());
}

export type {
  FsmController,
  FsmDefinition,
  HistoryController,
  PersistController,
  PersistenceAdapter,
  PersistOptions,
  TimeTravelController
} from '@selfagency/stately';
export {
  createLocalStorageAdapter,
  createMemoryStorageAdapter,
  createSessionStorageAdapter,
  defineStore,
  getDefaultStateManager,
  getStateManager,
  initializeStateManagerContext,
  storeToRefs
} from '@selfagency/stately';
