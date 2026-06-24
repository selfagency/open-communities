<script lang="ts">
  import CongregationList from '$lib/components/congregations/congregation-list.svelte';
  let { data } = $props();
</script>
<CongregationList {data} />
