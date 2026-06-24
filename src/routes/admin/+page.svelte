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
  />
  <AnalyticsSection digest={data.weeklyDigest} dailyTrend={data.dailyTrend} />
</div>
