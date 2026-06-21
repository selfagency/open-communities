import { render } from "@testing-library/svelte";

import type { Search } from "$lib/search";
import { m } from "$lib/paraglide/messages";
import { FakeSearch, setFiltersSpy } from "$test/stubs/fake-search";

import Filters from "./filters.svelte";

it("renders filter trigger", () => {
	const search = new FakeSearch() as unknown as Search;
	const { getByText } = render(Filters, { search });
	expect(getByText(m.filter())).toBeInTheDocument();
});

it("calls search.setFilters on mount with initial filters", () => {
	const search = new FakeSearch() as unknown as Search;
	render(Filters, { search });
	expect(setFiltersSpy).toHaveBeenCalled();
});
