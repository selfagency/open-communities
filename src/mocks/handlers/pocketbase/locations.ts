import { http, HttpResponse } from "msw";

import {
	allCities,
	countries,
	findCitiesByState,
	findStatesByCountry,
	states,
} from "../../data/locations";

const PB = "http://*:8090";

export const locationHandlers = [
	// GET /api/collections/countries/records
	http.get(`${PB}/api/collections/countries/records`, () =>
		HttpResponse.json({
			items: countries,
			page: 1,
			perPage: 50,
			totalItems: countries.length,
			totalPages: 1,
		}),
	),

	// GET /api/collections/states/records — with optional filter by country
	http.get(`${PB}/api/collections/states/records`, ({ request }) => {
		const url = new URL(request.url);
		const filter = url.searchParams.get("filter") ?? "";

		let items = states;

		// Handle PB filter: country={:country}
		const countryMatch = filter.match(
			/country\s*=\s*['"]?(\S+?)['"]?\s*(?:$|&|\b)/,
		);
		if (countryMatch) {
			items = findStatesByCountry(countryMatch[1]);
		}

		return HttpResponse.json({
			items,
			page: 1,
			perPage: 50,
			totalItems: items.length,
			totalPages: 1,
		});
	}),

	// GET /api/collections/cities/records — with optional filter by state
	http.get(`${PB}/api/collections/cities/records`, ({ request }) => {
		const url = new URL(request.url);
		const filter = url.searchParams.get("filter") ?? "";

		let items = allCities;

		// Handle PB filter: state={:state}
		const stateMatch = filter.match(
			/state\s*=\s*['"]?(\S+?)['"]?\s*(?:$|&|\b)/,
		);
		if (stateMatch) {
			items = findCitiesByState(stateMatch[1]);
		}

		return HttpResponse.json({
			items,
			page: 1,
			perPage: 50,
			totalItems: items.length,
			totalPages: 1,
		});
	}),
];
