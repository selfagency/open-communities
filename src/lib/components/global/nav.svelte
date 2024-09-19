<script lang="ts">
	/* region imports */
	import MenuIcon from 'lucide-svelte/icons/menu';

	import * as Sheet from '$lib/components/ui/sheet';
	import { t } from '$lib/i18n';
	import { state } from '$lib/stores';

	import Menu from './menu.svelte';
	/*  endregion imports */

	/* region variables */
	let open = false;
	/* endregion variables */
</script>

{#if $state.offsetWidth && $state.offsetWidth < 420}
	<Sheet.Root bind:open>
		<Sheet.Trigger>
			<MenuIcon class="mt-2 h-6 w-6" />
			<span class="sr-only">{$t('common.menu')}</span>
		</Sheet.Trigger>
		<Sheet.Content>
			<Menu mode="mini" on:close={() => (open = false)} />
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<Menu />
{/if}
