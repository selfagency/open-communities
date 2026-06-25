<script lang="ts">
import AnalyticsSection from '$lib/components/admin/analytics-section.svelte';
import StatCards from '$lib/components/admin/stat-cards.svelte';

let { data } = $props();
</script>

<div class="space-y-8">
  <StatCards
    congregations={data.stats.congregations}
    pendingApprovals={data.stats.pendingApprovals}
    topCountries={data.stats.topCountries}
    topStates={data.stats.topStates}
    users={data.stats.users}
  />
  <AnalyticsSection monthDigest={data.monthDigest} realtimeDigest={data.realtimeDigest} weekDigest={data.weekDigest} />
</div>
