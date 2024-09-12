<script lang="ts">
	/* region imports */
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores';
	/*  endregion imports */

	/* region variables */
	// props
	/* endregion variables */

	/* region methods */
	/* endregion methods */
</script>

<nav
	class="h-18 fixed left-0 top-0 z-50 flex w-screen flex-row items-center justify-between space-x-2 bg-white p-4 shadow"
>
	<div>
		<a href="/"><h1 class="text-xl font-bold">{$t('base.common.title')}</h1></a>
	</div>
	<div class="flex-row items-center justify-between space-x-2">
		{#if $user.congregation}
			<Button on:click={async () => await goto('/add')}>
				{$t('base.congregation.edit')}
			</Button>
		{:else}
			<Button on:click={async () => await goto('/add')}>
				{$t('base.congregation.add')}
			</Button>
		{/if}

		{#if $user.email}
			<Button variant="outline" on:click={async () => await goto('/logout')}>
				{$t('base.auth.logout')}
			</Button>
		{:else}
			<Button variant="outline" on:click={async () => await goto('/login')}>
				{$t('base.auth.login')} / {$t('base.auth.signUp')}
			</Button>
		{/if}
	</div>
</nav>
