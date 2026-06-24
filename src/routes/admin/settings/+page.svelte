<script lang="ts">
  import SettingsPanel from '$lib/components/settings/settings-panel.svelte';
  let { data } = $props();
</script>
<SettingsPanel {data} />
