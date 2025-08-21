import { fireEvent, render } from '@testing-library/svelte';

import type { Location } from '$lib/location';

import { m } from '$lib/paraglide/messages';
import { createFakeLocation } from '$test/stubs/fake-location';
import { FakeSearch } from '$test/stubs/fake-search';

import LocationComponent from './location.svelte';

it('renders when location options present and reset calls reset', async () => {
	const fakeLocation = createFakeLocation(
		{ city: undefined, country: { id: 'c1' }, state: undefined },
		{ countryOptions: [{ id: 'c1', label: 'C1', value: 'C1' }] }
	) as unknown as Location;

	const search = new FakeSearch();

	const { findByText } = render(LocationComponent, {
		location: fakeLocation,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		search: search as any
	});

	const resetBtn = await findByText(m.reset());
	expect(resetBtn).toBeInTheDocument();

	await fireEvent.click(resetBtn);
	expect(fakeLocation.reset).toHaveBeenCalled();
});

it('calls search.setSearchLocation on mount with record', async () => {
	const record = { city: undefined, country: { id: 'c1' }, state: undefined };
	const fakeLocation = createFakeLocation(record, {
		countryOptions: [{ id: 'c1', label: 'C1', value: 'C1' }]
	}) as unknown as Location;

	const search = new FakeSearch();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	render(LocationComponent, { location: fakeLocation, search: search as any });

	expect(search.setSearchLocation).toHaveBeenCalledWith(record);
});
