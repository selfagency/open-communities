<script lang="ts">
import PageList from '$lib/components/pages/page-list.svelte';

let { data } = $props();
</script>
<PageList {data} />
