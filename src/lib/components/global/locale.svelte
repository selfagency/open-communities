<script lang="ts">
	/* region imports */
	import { browser } from '$app/environment';
	import * as Select from '$lib/components/ui/select';
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores';
	/*  endregion imports */

	/* region variables */
	// constants
	const locales = ['de', 'en', 'es', 'fr', 'he', 'hu', 'pt', 'ru', 'uk'];
	const items = locales.map((l) => ({
		label: $t(`common.locale.${l}`),
		value: l
	}));

	// locals
	let lang = {
		label: $t(`common.locale.${$user.lang || 'en'}`),
		value: $user.lang || 'en'
	};
	/* endregion variables */

	/* region methods */
	const changeLocale = (value) => {
		if (browser) {
			const locale = value.value;
			user.set({ ...$user, lang: locale });
			window.location.reload();
		}
	};
	/* endregion methods */
</script>

<Select.Root name="locale" selected={lang} onSelectedChange={changeLocale}>
	<Select.Trigger class="w-36">
		<Select.Value />
	</Select.Trigger>
	<Select.Content>
		{#each items as { label, value }}
			<Select.Item {value}>{label}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
