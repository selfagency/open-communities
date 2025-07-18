<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import { page } from '$app/state';
	import Login from '$lib/components/login/index.svelte';
	import SignUp from '$lib/components/login/signup.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as m from '$lib/paraglide/messages';
	// import { log } from '$lib/utils';

	import type { PageProps, Snapshot } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const { data }: PageProps = $props();

	// locals
	let tab: 'login' | 'signup' = $state('login');
	let snapshotData = $state('');

	export const snapshot: Snapshot<string> = {
		capture: () => snapshotData,
		restore: (value) => (snapshotData = value)
	};
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		// log.info('login', data);
		if (page.url.searchParams.has('signUp') || page.url.searchParams.has('verifyEmail')) {
			tab = 'signup';
		}

		if (page.url.searchParams.has('resetPassword')) {
			tab = 'login';
		}
	});
	/* endregion lifecycle */
</script>

<svelte:head>
	<title>{m.login')} &middot; {$t('common.title}</title>
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center" style="min-height: 50vh;">
	<div class="w-full max-w-96">
		<Tabs.Root bind:value={tab}>
			<Tabs.List class="w-full">
				<Tabs.Trigger value="login" class="w-1/2">{m.login}</Tabs.Trigger>
				<Tabs.Trigger value="signup" class="w-1/2">{m.signUp}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="login">
				{#if tab === 'login' && data.login && data.reset}
					<Login data={data.login} reset={data.reset} />
				{/if}
			</Tabs.Content>
			<Tabs.Content value="signup">
				{#if tab === 'signup' && data.signup && data.verify}
					<SignUp data={data.signup} verify={data.verify} bind:snapshot={snapshotData} />
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
