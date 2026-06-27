<script lang="ts">
import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
import { onMount } from 'svelte';
import AnalyticsSection from '$lib/components/admin/analytics-section.svelte';
import StatCards from '$lib/components/admin/stat-cards.svelte';
import { m } from '$lib/paraglide/messages';
import type { Digest } from '$lib/schemas/analytics';

let { data } = $props();

let geoLoaded = $state(false);

interface GeoStats {
  topCities: Array<{ name: string; count: number }>;
  topCountries: Array<{ name: string; count: number }>;
  topStates: Array<{ name: string; count: number }>;
  totalCities: number;
  totalCountries: number;
  totalStates: number;
}

let geoStats = $state<GeoStats>({
  topCountries: [],
  topStates: [],
  topCities: [],
  totalCities: 0,
  totalStates: 0,
  totalCountries: 0
});

let monthDigest = $state<Digest | null>(null);
let realtimeDigest = $state<Digest | null>(null);
let weekDigest = $state<Digest | null>(null);

function fetchGeoStats() {
  fetch('/admin/stats')
    .then((r) => r.json())
    .then((json) => {
      geoStats = json;
      geoLoaded = true;
    })
    .catch(() => {
      geoLoaded = true;
    });
}

function fetchAnalytics() {
  fetch('/admin/analytics')
    .then((r) => r.json())
    .then((json) => {
      monthDigest = json.monthDigest;
      realtimeDigest = json.realtimeDigest;
      weekDigest = json.weekDigest;
    })
    .catch(() => {
      // ignore — digests stay null, component shows skeletons
    });
}

onMount(() => {
  fetchGeoStats();
  fetchAnalytics();

  const interval = setInterval(fetchAnalytics, 120_000);
  return () => clearInterval(interval);
});
</script>

<div class="space-y-8">
  <h2 class="flex items-center gap-2 text-2xl font-semibold">
    <DashboardIcon class="size-6" />
    {m.dashboard()}
  </h2>
  <StatCards
    congregations={data.stats.congregations}
    {geoLoaded}
    pendingApprovals={data.stats.pendingApprovals}
    topCities={geoStats.topCities}
    topCountries={geoStats.topCountries}
    topStates={geoStats.topStates}
    totalCities={geoStats.totalCities}
    totalCountries={geoStats.totalCountries}
    totalStates={geoStats.totalStates}
    users={data.stats.users}
  />
  <AnalyticsSection {monthDigest} {realtimeDigest} {weekDigest} />
</div>
