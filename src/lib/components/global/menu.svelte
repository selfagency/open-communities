<script lang="ts">
	/* region imports */
	import { createEventDispatcher } from 'svelte';

	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';
	import { state as appState } from '$lib/stores';

	import Locale from './locale.svelte';
	/*  endregion imports */

	/* region variables */
	// props
	let { mode = $bindable('full') }: { mode?: 'full' | 'mini' } = $props();

	// constants
	const dispatch = createEventDispatcher();
	const user = $derived(page.data.user);
	/* endregion variables */
</script>

<div
	class={mode === 'mini'
		? 'mt-8 flex flex-col items-start justify-start'
		: 'flex flex-row items-center justify-between space-x-2'}
>
	{#if user?.congregation && !user?.admin}
		<Button
			variant={mode === 'mini' ? 'link' : 'default'}
			onclick={async () => {
				dispatch('close');
				await goto(`/edit?id=${user?.congregation}`);
			}}
		>
			{mode === 'full' && $appState.isMobile ? m.edit() : m.editCongregation()}
		</Button>
	{:else}
		<Button
			variant={mode === 'mini' ? 'link' : 'default'}
			onclick={async () => {
				dispatch('close');
				await goto('/add');
			}}
		>
			{mode === 'full' && $appState.isMobile ? m.add() : m.addCongregation()}
		</Button>
	{/if}

	{#if user?.email}
		<Button
			variant={mode === 'mini' ? 'link' : 'outline'}
			onclick={async () => {
				dispatch('close');
				await goto('/logout');
			}}
		>
			{m.logout()}
		</Button>
	{:else}
		<Button
			variant={mode === 'mini' ? 'link' : 'outline'}
			onclick={async () => {
				dispatch('close');
				await goto('/login');
			}}
		>
			{m.login()}
			{mode === 'full' && $appState.isMobile ? '' : `/ ${m.signUp()}`}
		</Button>
	{/if}

	{#if dev}<Locale {mode} />{/if}
</div>
