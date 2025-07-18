<script lang="ts">
	/* region imports */
	import LocaleIcon from 'lucide-svelte/icons/languages';
	import { fade } from 'svelte/transition';

	import type { UsersLangOptions } from '$lib/pocketbase.d';

	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as m from '$lib/paraglide/messages';
	import { setState } from '$lib/stores';
	// import { log } from '$lib/utils';
	/*  endregion imports */

	/* region variables */
	// props
	let { mode = $bindable('full') }: { mode?: 'full' | 'mini' } = $props();

	// constants
	const locales = [
		{ label: 'Deutsch', value: 'de' },
		{ label: 'English', value: 'en' },
		{ label: 'Español', value: 'es' },
		{ label: 'Français', value: 'fr' },
		{ label: 'עברית', value: 'he' },
		{ label: 'Magyar', value: 'hu' },
		{ label: 'Português', value: 'pt' },
		{ label: 'Русский', value: 'ru' },
		{ label: 'Українська', value: 'uk' }
	];

	// locals
	let hovering = $state(false);
	let lang = $state(page.data.user?.lang || 'en') as UsersLangOptions;
	/* endregion variables */

	/* region reactivity */
	$effect(() => {
		if (lang !== page.data.user?.lang) {
			setState({ lang });
		}
	});

	/* endregion reactivity */
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button
			variant={mode === 'mini' ? 'link' : 'ghost'}
			class="flex flex-row items-center justify-start space-x-1"
			onmouseenter={() => (hovering = true)}
			onmouseleave={() => (hovering = false)}
		>
			{@const locale = locales.find((f) => f.value === lang)?.label}
			{#if mode === 'mini'}
				<LocaleIcon class="h-4 w-4 text-slate-500" />
				<span>{locale}</span>
			{:else}
				<LocaleIcon class="h-4 w-4 text-slate-500" />
				{#if hovering}<span transition:fade>{locale}</span>{/if}
			{/if}
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Label>{m.language()}</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.RadioGroup bind:value={lang}>
			{#each locales as { label, value }, i (i)}
				<DropdownMenu.RadioItem {value} class="flex flex-row items-center justify-start space-x-2">
					<Badge variant="outline" class="text-xs font-normal">{value.toUpperCase()}</Badge>
					<span>{label}</span>
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
