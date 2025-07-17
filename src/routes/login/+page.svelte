<script lang="ts">
	/* region imports */
	import { onMount } from 'svelte';

	import { page } from '$app/state';
	import Login from '$lib/components/login/index.svelte';
	import SignUp from '$lib/components/login/signup.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { t } from '$lib/i18n';

	import type { PageData, Snapshot } from './$types';
	/* endregion imports */

	/* region variables */
	// props
	const data: PageData = $props();

	// locals
	let tab: 'login' | 'signup' = $state('login');
	let userData = $state('');

	export const snapshot: Snapshot<string> = {
		capture: () => userData,
		restore: (value) => (userData = value)
	};
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
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
	<title>{$t('auth.login')} &middot; {$t('common.title')}</title>
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center" style="min-height: 50vh;">
	<div class="w-full max-w-96">
		<Tabs.Root bind:value={tab}>
			<Tabs.List class="w-full">
				<Tabs.Trigger value="login" class="w-1/2">{$t('auth.login')}</Tabs.Trigger>
				<Tabs.Trigger value="signup" class="w-1/2">{$t('auth.signUp')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="login">
				<Login data={data.form.login} reset={data.form.reset} />
			</Tabs.Content>
			<Tabs.Content value="signup">
				<SignUp data={data.form.signup} verify={data.form.verify} bind:snapshot={userData} />
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
