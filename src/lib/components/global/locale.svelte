<script lang="ts">
	/* region imports */
	import LocaleIcon from 'lucide-svelte/icons/languages';
	import { fade } from 'svelte/transition';

	import type { UsersLangOptions } from '$lib/types';

	import { browser } from '$app/environment';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores';
	import { log } from '$lib/utils';
	/*  endregion imports */

	/* region variables */
	// props
	export let mode: 'mini' | 'full' = 'full';

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
	let lang = ($user.lang || 'en') as UsersLangOptions;
	let hovering = false;
	/* endregion variables */

	/* region reactivity */
	$: if (lang && lang !== $user.lang && browser) {
		user.set({ ...$user, lang });
		window.location.reload();
	}

	$: if (hovering) {
		log.debug('hovering', hovering);
	}
	/* endregion reactivity */
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button
			variant={mode === 'mini' ? 'link' : 'ghost'}
			builders={[builder]}
			class="flex flex-row items-center justify-start space-x-1"
			on:mouseenter={() => (hovering = true)}
			on:mouseleave={() => (hovering = false)}
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
		<DropdownMenu.Label>{$t('common.language')}</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.RadioGroup bind:value={lang}>
			{#each locales as { label, value }}
				<DropdownMenu.RadioItem {value} class="flex flex-row items-center justify-start space-x-2">
					<Badge variant="outline" class="text-xs font-normal">{value.toUpperCase()}</Badge>
					<span>{label}</span>
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
