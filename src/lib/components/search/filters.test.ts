import { render } from '@testing-library/svelte';

import { m } from '$lib/paraglide/messages';
import { FakeSearch, setFiltersSpy } from '$test/stubs/fake-search';

import Filters from './filters.svelte';

it('renders filter trigger', () => {
	const search = new FakeSearch();
	const { getByText } = render(Filters, { search: search });
	expect(getByText(m.filter())).toBeInTheDocument();
});

it('calls search.setFilters on mount with initial filters', () => {
	const search = new FakeSearch();
	render(Filters, { search: search });
	expect(setFiltersSpy).toHaveBeenCalled();
});
