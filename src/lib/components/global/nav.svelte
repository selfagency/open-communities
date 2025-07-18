<script lang="ts">
	/* region imports */
	import MenuIcon from 'lucide-svelte/icons/menu';

	import * as Sheet from '$lib/components/ui/sheet';
	import * as m from '$lib/paraglide/messages';
	import { state as appState } from '$lib/stores';

	import Menu from './menu.svelte';
	/*  endregion imports */

	/* region variables */
	let open = $state(false);
	/* endregion variables */
</script>

{#if $appState.offsetWidth && $appState.offsetWidth < 420}
	<Sheet.Root bind:open>
		<Sheet.Trigger>
			<MenuIcon class="mt-2 h-6 w-6" />
			<span class="sr-only">{m.menu}</span>
		</Sheet.Trigger>
		<Sheet.Content>
			<Sheet.Description>
				<Menu mode="mini" on:close={() => (open = false)} />
			</Sheet.Description>
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<Menu />
{/if}
