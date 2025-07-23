<script lang="ts">
	/* region imports */
	import ResetIcon from 'lucide-svelte/icons/circle-x';
	import { isEmpty } from 'radashi';
	import { untrack } from 'svelte';

	import Combobox from '$lib/components/global/combobox.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Location } from '$lib/location';
	import * as m from '$lib/paraglide/messages';
	import { Search } from '$lib/search';
	/* endregion imports */

	/* region variables */
	// props
	const { location, search }: { location: Location; search: Search } = $props();

	// constants
	const { reset, setCity, setCountry, setState, state: locationState } = location;

	// locals
	// Initialize state from the store without creating a subscription.
	let country = $state(untrack(() => $locationState.record.country?.id ?? ''));
	let province = $state(untrack(() => $locationState.record.state?.id ?? ''));
	let city = $state(untrack(() => $locationState.record.city?.id ?? ''));

	/* region methods */
	function handleCountryChange(event: CustomEvent) {
		const selectedId = event.detail.value;
		country = selectedId;
		setCountry(selectedId);
	}

	function handleStateChange(event: CustomEvent) {
		const selectedId = event.detail.value;
		province = selectedId;
		setState(selectedId);
	}

	function handleCityChange(event: CustomEvent) {
		const selectedId = event.detail.value;
		city = selectedId;
		setCity(selectedId);
	}
	/* endregion methods */

	/* region reactivity */
	$effect(() => {
		const loc = $locationState.record;
		search.setSearchLocation(loc);

		// Sync local state from the store only if it differs
		untrack(() => {
			if (country !== (loc.country?.id ?? '')) {
				country = loc.country?.id ?? '';
			}
			if (province !== (loc.state?.id ?? '')) {
				province = loc.state?.id ?? '';
			}
			if (city !== (loc.city?.id ?? '')) {
				city = loc.city?.id ?? '';
			}
		});
	});
	/* endregion reactivity */
</script>

{#if !isEmpty($locationState.options)}
	<div
		class="flex w-full flex-col items-center justify-between space-y-2 rounded-lg bg-slate-100 p-2 sm:flex-row sm:space-y-0 sm:space-x-2"
	>
		<div
			class="flex w-full flex-col items-center justify-start space-y-4 sm:flex-row sm:space-y-0 sm:space-x-2"
		>
			<span class="w-full sm:w-1/3">
				<Combobox
					items={$locationState.options.countryOptions}
					value={country}
					on:change={handleCountryChange}
					placeholder={m.selectThing({ thing: m['location.country']().toLowerCase() })}
					disabled={!$locationState.options?.countryOptions?.length}
				/>
			</span>

			<span class="w-full sm:w-1/3">
				<Combobox
					items={$locationState.options.stateOptions}
					value={province}
					on:change={handleStateChange}
					placeholder={m.selectThing({ thing: m['location.state']().toLowerCase() })}
					disabled={!country || !$locationState.options?.stateOptions?.length}
				/>
			</span>

			<span class="w-full sm:w-1/3">
				<Combobox
					items={$locationState.options.cityOptions}
					value={city}
					on:change={handleCityChange}
					placeholder={m.selectThing({ thing: m['location.city']().toLowerCase() })}
					disabled={!province || !$locationState.options?.cityOptions?.length}
				/>
			</span>
		</div>

		<span>
			<Button
				variant="link"
				class="h-auto"
				onclick={() => {
					reset();
				}}
			>
				<span
					class="flex flex-row items-center justify-start space-x-1 text-slate-500 hover:text-slate-700"
				>
					<ResetIcon size="16" class="rtl:mx-1" />
					<span>{m.reset()}</span>
				</span>
			</Button>
		</span>
	</div>
{/if}
