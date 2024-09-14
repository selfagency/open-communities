<script lang="ts">
	import { goto } from '$app/navigation';
	/* region imports */
	import Tent from '$lib/assets/tent.svg?component';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n';
	import { user, state } from '$lib/stores';
	/*  endregion imports */

	/* region variables */
	// props
	/* endregion variables */

	/* region methods */
	/* endregion methods */
</script>

<nav
	class="h-18 fixed left-0 top-0 z-50 flex w-screen min-w-max flex-row items-center justify-between space-x-2 bg-white p-4 shadow"
>
	<div>
		<a href="/" class="flex flex-row items-center justify-start space-x-2">
			<span>
				<Tent class="w-12 fill-slate-700 sm:w-16" />
			</span>
			<h1 class="mt-2 font-display text-2xl font-bold sm:text-3xl">{$t('common.title')}</h1>
		</a>
	</div>
	<div class="flex-row items-center justify-between space-x-2">
		{#if $user.congregation}
			<Button on:click={async () => await goto('/add')}>
				{$state.isMobile ? $t('congregation.edit') : $t('congregation.editCongregation')}
			</Button>
		{:else}
			<Button on:click={async () => await goto('/add')}>
				{$state.isMobile ? $t('congregation.add') : $t('congregation.addCongregation')}
			</Button>
		{/if}

		{#if $user.email}
			<Button variant="outline" on:click={async () => await goto('/logout')}>
				{$t('auth.logout')}
			</Button>
		{:else}
			<Button variant="outline" on:click={async () => await goto('/login')}>
				{$t('auth.login')}
				{$state.isMobile ? '' : `/ ${$t('auth.signUp')}`}
			</Button>
		{/if}
	</div>
</nav>
