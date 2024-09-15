import { Country, State, City } from 'country-state-city';
import Fuse from 'fuse.js';
import latinize from 'latinize';
import Pocketbase from 'pocketbase';
import { sleep } from 'radashi';

export async function search(query, options) {
	const queryOptions = parseOptions(options);
	const queryString = parseQuery(query);
	const result = await fetch(
		`https://nominatim.openstreetmap.org/search.php?${queryString}&format=jsonv2${queryOptions}`
	);
	return await result.json();
}

async function reverse(lat, lon, options) {
	const queryOptions = parseOptions(options);
	const result = await fetch(
		`https://nominatim.openstreetmap.org/reverse.php?lat=${lat}&lon=${lon}&format=jsonv2${queryOptions}`
	);
	const json = await result.json();
	if ('error' in json) {
		json.is_error = true;
		return json;
	} else {
		json.is_error = false;
		return json;
	}
}

// INTERNAL: UTILITY FUNCTIONS

function parseOptions(opt) {
	let options = [];
	if (opt.languages) {
		options.push(`accept-language=${opt.languages.join(',')}`);
	}
	if (opt.dedupeResults !== undefined) {
		options.push(`dedupe=${opt.dedupeResults ? 1 : 0}`);
	}
	if (opt.countryCodes !== undefined) {
		options.push(`countrycodes=${opt.countryCodes.join(',')}`);
	}

	if (opt !== undefined) {
		const o = opt;
		if (o.fullAddress) {
			options.push('addressdetails=1');
		}
		if (o.limit) {
			options.push(`limit=${o.limit}`);
		}
		if (o.boundingBox) {
			options.push(`viewbox=${o.boundingBox.join(',')}`);
			options.push(`bounded=1`);
		}
	}

	const result = options.join('&');
	if (result.length > 0) {
		return `&${result}`;
	}
	return '';
}

function parseQuery(query) {
	if (typeof query === 'string') {
		return `q=${query}`;
	} else {
		return '';
	}
}

const pb = new Pocketbase(process.env.PB_ENDPOINT);

// const countries = Country.getAllCountries();
// const states = State.getAllStates();
const cities = City.getAllCities();

(async () => {
	try {
		await pb.admins.authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

		const countries = await pb.collection('countries').getFullList();
		let states = await pb.collection('states').getFullList();

		// const countryIds = [];
		// for (const country of countries) {
		// 	await sleep(500);
		// 	const record = await pb.collection('countries').create({
		// 		name: country.name,
		// 		code: country.isoCode,
		// 		flag: country.flag,
		// 		longitude: country.longitude,
		// 		latitude: country.latitude
		// 	});
		// 	countryIds.push({ id: record.id, country: country.isoCode });
		// }

		// const stateIds = [];
		// for (const state of states) {
		// 	// const stateExists = exists.find((s) => s.code === state.isoCode);
		// 	// if (stateExists) continue;

		// 	await sleep(10);
		// 	const record = await pb.collection('states').create({
		// 		name: state.name,
		// 		country: countries.find((country) => country.code === state.countryCode).id,
		// 		code: state.isoCode,
		// 		longitude: state.longitude,
		// 		latitude: state.latitude
		// 	});
		// 	stateIds.push({ id: record.id, state: state.isoCode });
		// }

		for (const city of cities) {
			const country = countries.find((country) => country.code === city.countryCode);
			let state = states.find(
				(state) => state.code === city.stateCode && state.country === country.id
			);

			if (!state) {
				await sleep(10);
				const stateName = await reverse(city.latitude, city.longitude, {
					zoomlevel: 10
				}).address.state;
				await sleep(10);
				const stateData = await search(`${stateName} ${country.name}`).find(
					(s) => s.extratags.border_type === 'state' || s.extratags.border_type === 'provincial'
				);

				if (stateData) {
					state = await pb.collection('states').create({
						name: stateData.names.state,
						code: stateData.names.ref,
						country: country.id,
						latitude: stateData.centroid.coordinates[1],
						longitude: stateData.centroid.coordinates[0]
					});

					states = await pb.collection('states').getFullList();
				}
			}

			const record = {
				country: country?.id,
				state: state?.id,
				name: city.name,
				longitude: city.longitude,
				latitude: city.latitude
			};

			await pb.collection('cities').create(record);
		}
	} catch (error) {
		console.log(error);
	}
})();

// (async () => {
// 	try {
// 		await pb.admins.authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

// 		const countries = await pb.collection('countries').getFullList();
// 		const states = await pb.collection('states').getFullList();
// 		const exists = await pb.collection('cities').getFullList();

// 		for (const city of cities) {
// 			const country = countries.find((country) => country.code === city.countryCode);
// 			const state = states.find(
// 				(state) => state.code === city.stateCode && state.country === country?.id
// 			);

// 			const record = {
// 				country: country?.id,
// 				state: state?.id,
// 				name: city.name,
// 				longitude: city.longitude,
// 				latitude: city.latitude
// 			};

// 			const cityExists = exists.find(
// 				(city) =>
// 					city.name === city.name && (city.state === state?.id || city.country === country?.id)
// 			);

// 			if (!cityExists) {
// 				await sleep(5);
// 				await pb.collection('cities').create(record);
// 			}
// 		}
// 	} catch (error) {
// 		console.log(error);
// 	}
// })();

// (async () => {
// 	await pb.admins.authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);
// 	const cities = await pb
// 		.collection('cities')
// 		.getFullList({ filter: 'state=""', expand: ['country'] });
// 	const states = await pb.collection('states').getFullList({ expand: ['country'] });

// 	let fuse = new Fuse(states, {
// 		keys: ['name'],
// 		threshold: 0.3
// 	});

// 	const latinized = new Fuse(
// 		states.map((s) => {
// 			s.name = latinize(s.name);
// 			return s;
// 		}),
// 		{
// 			keys: ['name'],
// 			threshold: 0.3
// 		}
// 	);

// 	for (const city of cities) {
// 		if (city.latitude && city.longitude) {
// 			try {
// 				console.log(
// 					`Processing city: ${city.name}, ${city.expand?.country?.name} (${cities.indexOf(city)} / ${cities.length})`
// 				);

// 				await sleep(10);

// 				if (city.latitude && city.longitude) {
// 					const response = await reverse(city.latitude, city.longitude, {
// 						zoomlevel: 10
// 					});

// 					if (response.address.state) {
// 						let result = fuse.search(response.address.state);

// 						if (result.length === 0) {
// 							result = latinized.search(latinize(response.address.state));
// 						}

// 						if (result > 1) {
// 							result.filter(
// 								(state) =>
// 									(state.country = city?.country) ||
// 									response.address.country_code.startsWith(state.item.expand.country.code) ||
// 									response.address.country === state.item.expand.country.name
// 							);
// 						}

// 						if (result.length > 0) {
// 							const state = result[0].item;
// 							console.log(`Matched state: ${state.name}, Country: ${state.expand?.country?.code}`);

// 							await pb.collection('cities').update(city.id, { state: state.id });
// 							continue;
// 						} else {
// 							console.log(`No match found for state: ${response.address.state}. Adding.`);

// 							const state = await pb.collection('states').create({
// 								name: response.address?.state,
// 								country: city?.country,
// 								longitude: response.lon,
// 								latitude: response.lat
// 							});

// 							states.push(state);
// 							fuse = new Fuse(states, {
// 								keys: ['name'],
// 								threshold: 0.3
// 							});

// 							await pb.collection('cities').update(city.id, { state: state?.id });
// 							continue;
// 						}
// 					}
// 				} else {
// 					console.log(`No coordinates found for city: ${city.name}`);
// 					continue;
// 				}
// 			} catch (err) {
// 				console.log(err);
// 				continue;
// 			}
// 		}
// 	}
// })();
