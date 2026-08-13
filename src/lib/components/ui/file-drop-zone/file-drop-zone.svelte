<script lang="ts">
import { box } from 'svelte-toolbelt';
import { useFileDropZone } from './file-drop-zone.svelte.js';
import type { FileDropZoneRootProps } from './types.js';

const uid = $props.id();
let {
  id = uid,
  maxFiles,
  maxFileSize,
  fileCount,
  disabled = false,
  onUpload,
  onFileRejected,
  accept,
  children,
  ...rest
}: FileDropZoneRootProps = $props();

const rootState = useFileDropZone({
  accept: box.with(() => accept),
  disabled: box.with(() => disabled ?? false),
  fileCount: box.with(() => fileCount),
  id: box.with(() => id),
  maxFileSize: box.with(() => maxFileSize),
  maxFiles: box.with(() => maxFiles),
  onFileRejected: box.with(() => onFileRejected),
  onUpload: box.with(() => onUpload)
});
</script>

<input class="hidden" {...rootState.props} {...rest} />

{@render children?.()}
