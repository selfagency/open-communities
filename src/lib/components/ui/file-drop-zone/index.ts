// @ts-ignore: Svelte 5 component default export not recognized by TS-Go
import _Root from './file-drop-zone.svelte';
// @ts-ignore: Svelte 5 component default export not recognized by TS-Go
import _Trigger from './file-drop-zone-trigger.svelte';
export const Root = _Root;
export const Trigger = _Trigger;

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

const BYTE = 1;
const KILOBYTE = 1000;
const MEGABYTE = 1000 * KILOBYTE;
const GIGABYTE = 1000 * MEGABYTE;

export const ACCEPT_IMAGE = 'image/*';
const ACCEPT_VIDEO = 'video/*';
const ACCEPT_AUDIO = 'audio/*';

export type { FileDropZoneRootProps, FileRejectedReason } from './types';
