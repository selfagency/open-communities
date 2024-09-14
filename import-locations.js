import { Country, State, City } from 'country-state-city';
import Pocketbase from 'pocketbase';
import { sleep } from 'radashi';

const pb = new Pocketbase(process.env.PB_ENDPOINT);

// const countries = Country.getAllCountries();
// const states = State.getAllStates();
const cities = City.getAllCities();

// (async () => {
// 	try {
// 		await pb.admins.authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

// 		const countryIds = [];
// 		for (const country of countries) {
// 			await sleep(500);
// 			const record = await pb.collection('countries').create({
// 				name: country.name,
// 				code: country.isoCode,
// 				flag: country.flag,
// 				longitude: country.longitude,
// 				latitude: country.latitude
// 			});
// 			countryIds.push({ id: record.id, country: country.isoCode });
// 		}

// 		const stateIds = [];
// 		for (const state of states) {
// 			await sleep(500);
// 			const record = await pb.collection('states').create({
// 				name: state.name,
// 				country: countryIds.find((country) => country.country === state.countryCode).id,
// 				code: state.isoCode,
// 				longitude: state.longitude,
// 				latitude: state.latitude
// 			});
// 			stateIds.push({ id: record.id, state: state.isoCode });
// 		}

// 		for (const city of cities) {
// 			await sleep(500);
// 			const country = countries.find((country) => country.code === city.countryCode);
// 			const state = states.find(
// 				(state) => state.code === city.stateCode && state.country === country.id
// 			);

// 			const record = {
// 				country: country?.id,
// 				state: state?.id,
// 				name: city.name,
// 				longitude: city.longitude,
// 				latitude: city.latitude
// 			};

// 			await pb.collection('cities').create(record);
// 		}
// 	} catch (error) {
// 		console.log(error);
// 	}
// })();

(async () => {
	try {
		await pb.admins.authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

		const countries = await pb.collection('countries').getFullList();
		const states = await pb.collection('states').getFullList();
		const exists = await pb.collection('cities').getFullList();

		for (const city of cities) {
			await sleep(500);
			const country = countries.find((country) => country.code === city.countryCode);
			const state = states.find(
				(state) => state.code === city.stateCode && state.country === country.id
			);

			const cityExists = exists.find((city) => city.name === city.name && city.state === state.id);

			const record = {
				country: country?.id,
				state: state?.id,
				name: city.name,
				longitude: city.longitude,
				latitude: city.latitude
			};

			if (!cityExists) await pb.collection('cities').create(record);
		}
	} catch (error) {
		console.log(error);
	}
})();
