export { default as Root } from './file-drop-zone.svelte';
export { default as Trigger } from './file-drop-zone-trigger.svelte';

export function displaySize(bytes: number): string {
  if (bytes < KILOBYTE) {
    return `${bytes.toFixed(0)} B`;
  }

  if (bytes < MEGABYTE) {
    return `${(bytes / KILOBYTE).toFixed(0)} KB`;
  }

  if (bytes < GIGABYTE) {
    return `${(bytes / MEGABYTE).toFixed(0)} MB`;
  }

  return `${(bytes / GIGABYTE).toFixed(0)} GB`;
}

// Utilities for working with file sizes
const BYTE = 1;
const KILOBYTE = 1000;
const MEGABYTE = 1000 * KILOBYTE;
const GIGABYTE = 1000 * MEGABYTE;

// utilities for limiting accepted files
export const ACCEPT_IMAGE = 'image/*';
const ACCEPT_VIDEO = 'video/*';
const ACCEPT_AUDIO = 'audio/*';

export type { FileDropZoneRootProps, FileRejectedReason } from './types';
