<script lang="ts">
import AnalyticsSection from '$lib/components/admin/analytics-section.svelte';
import StatCards from '$lib/components/admin/stat-cards.svelte';

let { data } = $props();
</script>

<div class="space-y-8">
  <StatCards
    congregations={data.stats.congregations}
    users={data.stats.users}
    pendingApprovals={data.stats.pendingApprovals}
    topCountries={data.stats.topCountries}
    topStates={data.stats.topStates}
  />
  <AnalyticsSection realtimeDigest={data.realtimeDigest} weekDigest={data.weekDigest} monthDigest={data.monthDigest} />
</div>
