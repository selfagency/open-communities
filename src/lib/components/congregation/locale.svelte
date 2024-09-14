<script lang="ts">
	/* region imports */
	import ResetIcon from 'lucide-svelte/icons/circle-x';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import { Button } from '$lib/components/ui/button';
	import Combobox from '$lib/components/ui/combobox/index.svelte';
	import { t } from '$lib/i18n';
	import { Locale } from '$lib/locale';
	import { Search } from '$lib/search';
	// import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let search: Search;

	// constants
	const { state: locale, reset, setCountry, setState: setLocale, setCity } = new Locale(search);

	// local vars
	let country: string = '';
	let state: string = '';
	let city: string = '';
	/* endregion variables */

	/* region lifecycle */
	onMount(() => {
		locale.subscribe((value) => {
			search.setSearchLocale(value.record);
		});
	});
	/* endregion lifecycle */
</script>

<div
	class="flex w-full flex-col items-center justify-between space-y-2 rounded-lg bg-slate-100 p-2 sm:flex-row sm:space-x-2 sm:space-y-0"
>
	<div
		class="flex w-full flex-col items-center justify-start space-y-4 sm:flex-row sm:space-x-2 sm:space-y-0"
	>
		<span transition:fade class="w-full sm:w-1/3">
			<Combobox
				items={$locale.options.countryOptions}
				bind:value={country}
				placeholder={$t('common.selectThing', {
					thing: $t('locale.country').toLowerCase()
				})}
				disabled={!$locale.options?.countryOptions?.length}
				on:change={() => setCountry(country)}
			/>
		</span>

		<span transition:fade class="w-full sm:w-1/3">
			<Combobox
				items={$locale.options.stateOptions}
				bind:value={state}
				placeholder={$t('common.selectThing', {
					thing: $t('locale.state').toLowerCase()
				})}
				disabled={!country && !$locale.options?.stateOptions?.length}
				on:change={() => setLocale(state)}
			/>
		</span>

		<span transition:fade class="w-full sm:w-1/3">
			<Combobox
				items={$locale.options.cityOptions}
				bind:value={city}
				placeholder={$t('common.selectThing', {
					thing: $t('locale.city').toLowerCase()
				})}
				disabled={!state || !$locale.options?.cityOptions?.length}
				on:change={() => setCity(city)}
			/>
		</span>
	</div>

	<span>
		<Button
			variant="link"
			class="h-auto"
			on:click={() => {
				country = '';
				state = '';
				city = '';
				reset();
			}}
		>
			<span
				class="flex flex-row items-center justify-start space-x-1 text-slate-500 hover:text-slate-700"
			>
				<ResetIcon size="16" />
				<span>{$t('common.reset')}</span>
			</span>
		</Button>
	</span>
</div>
