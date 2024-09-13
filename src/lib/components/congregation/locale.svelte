<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';

	import Combobox from '$lib/components/ui/combobox/index.svelte';
	import { t } from '$lib/i18n';
	import { setState, Locale } from '$lib/stores';
	// import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// constants
	const { state: locale, setCountry, setState: setLocale, setCity } = new Locale();
	// log.debug($locale);

	// local vars
	let country: string = '';
	let state: string = '';
	let city: string = '';
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		locale.subscribe((value) => {
			if (!isEmpty(value.record)) setState({ searchLocale: value.record });
		});
	});
	/* endregion lifecycle */
</script>

<div class="flex flex-row items-center justify-center space-x-2">
	<Combobox
		items={$locale.options.countryOptions}
		bind:value={country}
		placeholder={$t('base.common.selectThing', {
			thing: $t('base.locale.country').toLowerCase()
		})}
		on:change={() => setCountry(country)}
	/>

	<Combobox
		items={$locale.options.stateOptions}
		bind:value={state}
		placeholder={$t('base.common.selectThing', {
			thing: $t('base.locale.state').toLowerCase()
		})}
		disabled={!country}
		on:change={() => setLocale(state)}
	/>

	<Combobox
		items={$locale.options.cityOptions}
		bind:value={city}
		placeholder={$t('base.common.selectThing', {
			thing: $t('base.locale.city').toLowerCase()
		})}
		disabled={!state}
		on:change={() => setCity(city)}
	/>
</div>
