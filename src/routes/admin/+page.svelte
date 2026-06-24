<script lang="ts">
  let { data } = $props();
  const stats = data.stats;
</script>

<div class="px-4 lg:px-6">
  <div class="mb-8">
    <h1 class="text-2xl font-semibold">Dashboard</h1>
    <p class="text-muted-foreground text-sm">Overview of your community</p>
  </div>

  <div class="grid gap-4 md:grid-cols-3">
    <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
      <div class="flex items-center justify-between">
        <p class="text-muted-foreground text-sm font-medium">Congregations</p>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground size-4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <p class="mt-2 text-3xl font-bold">{stats.congregations}</p>
    </div>

    <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
      <div class="flex items-center justify-between">
        <p class="text-muted-foreground text-sm font-medium">Users</p>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground size-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <p class="mt-2 text-3xl font-bold">{stats.users}</p>
    </div>

    <div class="bg-card text-card-foreground rounded-xl border p-6 shadow-xs">
      <div class="flex items-center justify-between">
        <p class="text-muted-foreground text-sm font-medium">Pending Approvals</p>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground size-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <p class="mt-2 text-3xl font-bold">{stats.pendingApprovals}</p>
    </div>
  </div>
</div>
