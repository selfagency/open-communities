<script lang="ts">
	/* region imports */
	import ResetIcon from 'lucide-svelte/icons/circle-x';
	import { isEmpty } from 'radashi';
	import { onMount } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import Combobox from '$lib/components/ui/combobox/index.svelte';
	import { t } from '$lib/i18n';
	import { Location } from '$lib/location';
	import { Search } from '$lib/search';
	import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	export let search: Search;
	export let location: Location;

	// constants
	const { state: locationState, reset, setCountry, setState, setCity } = location;

	// local vars
	let country: string = '';
	let state: string = '';
	let city: string = '';
	/* endregion variables */

	/* region lifecycle */
	onMount(async () => {
		country = $locationState.record.country?.id || '';
		if ($locationState.record.state) state = $locationState.record.state?.id || '';
		if ($locationState.record.city) city = $locationState.record.city?.id || '';

		locationState.subscribe((value) => {
			log.debug('locationState', value);
			if (value.record.country) {
				search.setSearchLocation(value.record);
				country = value.record.country?.id || '';
				if (value.record.state) state = $locationState.record.state?.id || '';
				if (value.record.city) city = $locationState.record.city?.id || '';
			}
		});
	});
	/* endregion lifecycle */
</script>

{#if !isEmpty($locationState.options)}
	<div
		class="flex w-full flex-col items-center justify-between space-y-2 rounded-lg bg-slate-100 p-2 sm:flex-row sm:space-x-2 sm:space-y-0"
	>
		<div
			class="flex w-full flex-col items-center justify-start space-y-4 sm:flex-row sm:space-x-2 sm:space-y-0"
		>
			<span class="w-full sm:w-1/3">
				<Combobox
					items={$locationState.options.countryOptions}
					bind:value={country}
					placeholder={$t('common.selectThing', {
						thing: $t('congregation.location.country').toLowerCase()
					})}
					disabled={!$locationState.options?.countryOptions?.length}
					on:change={() => setCountry(country)}
				/>
			</span>

			<span class="w-full sm:w-1/3">
				<Combobox
					items={$locationState.options.stateOptions}
					bind:value={state}
					placeholder={$t('common.selectThing', {
						thing: $t('congregation.location.state').toLowerCase()
					})}
					disabled={!country && !$locationState.options?.stateOptions?.length}
					on:change={() => setState(state)}
				/>
			</span>

			<span class="w-full sm:w-1/3">
				<Combobox
					items={$locationState.options.cityOptions}
					bind:value={city}
					placeholder={$t('common.selectThing', {
						thing: $t('congregation.location.city').toLowerCase()
					})}
					disabled={!state && !$locationState.options?.cityOptions?.length}
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
{/if}
