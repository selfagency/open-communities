<script lang="ts">
	/* region imports */
	import { createEventDispatcher } from 'svelte';

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n';
	import { user, state } from '$lib/stores';
	/*  endregion imports */

	/* region variables */
	// props
	export let mode: 'mini' | 'full' = 'full';

	// constants
	const dispatch = createEventDispatcher();
	/* endregion variables */
</script>

<div
	class={mode === 'mini'
		? 'mt-8 flex flex-col items-start justify-start'
		: 'flex flex-row items-center justify-between space-x-2'}
>
	{#if $user.congregation}
		<Button
			variant={mode === 'mini' ? 'link' : 'default'}
			on:click={async () => {
				dispatch('close');
				await goto('/edit');
			}}
		>
			{mode === 'full' && $state.isMobile
				? $t('congregation.edit')
				: $t('congregation.editCongregation')}
		</Button>
	{:else}
		<Button
			variant={mode === 'mini' ? 'link' : 'default'}
			on:click={async () => {
				dispatch('close');
				await goto('/add');
			}}
		>
			{mode === 'full' && $state.isMobile
				? $t('congregation.add')
				: $t('congregation.addCongregation')}
		</Button>
	{/if}

	{#if $user.email}
		<Button
			variant={mode === 'mini' ? 'link' : 'outline'}
			on:click={async () => {
				dispatch('close');
				await goto('/logout');
			}}
		>
			{$t('auth.logout')}
		</Button>
	{:else}
		<Button
			variant={mode === 'mini' ? 'link' : 'outline'}
			on:click={async () => {
				dispatch('close');
				await goto('/login');
			}}
		>
			{$t('auth.login')}
			{mode === 'full' && $state.isMobile ? '' : `/ ${$t('auth.signUp')}`}
		</Button>
	{/if}
</div>
