<script lang="ts">
	/* region imports */
	import MenuIcon from 'lucide-svelte/icons/menu';

	import Tent from '$lib/assets/tent.svg?component';
	import * as Sheet from '$lib/components/ui/sheet';
	import { t } from '$lib/i18n';
	import { state } from '$lib/stores';

	import Nav from './nav.svelte';
	/*  endregion imports */
</script>

<nav
	class="h-18 fixed left-0 top-0 z-50 flex w-screen min-w-max flex-row items-center justify-between space-x-2 bg-white p-4 shadow"
>
	<div>
		<a href="/" class="flex flex-row items-center justify-start space-x-2">
			<span>
				<Tent class="w-12 fill-slate-700 sm:w-16" />
			</span>
			<h1 class="mt-2 text-2xl sm:text-3xl">{$t('common.title')}</h1>
		</a>
	</div>
	<div>
		{#if $state.offsetWidth && $state.offsetWidth < 420}
			<Sheet.Root>
				<Sheet.Trigger>
					<MenuIcon class="mt-2 h-6 w-6" />
					<span class="sr-only">{$t('common.menu')}</span>
				</Sheet.Trigger>
				<Sheet.Content>
					<Nav mode="mini" />
				</Sheet.Content>
			</Sheet.Root>
		{:else}
			<Nav />
		{/if}
	</div>
</nav>
