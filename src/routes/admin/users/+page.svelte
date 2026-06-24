<script lang="ts">
  import UserList from '$lib/components/users/user-list.svelte';

  let { data } = $props();
</script>
<UserList {data} />
