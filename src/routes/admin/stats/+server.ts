import { error, json } from '@sveltejs/kit';
import { withRetry } from '$lib/server/api';
import type { RequestHandler } from './$types';

interface CountriesByQtyView {
  congregation_count: number;
  country_code: string;
  country_flag: string;
  country_name: string;
  id: string;
}

interface StatesByQtyView {
  congregation_count: number;
  country_name: string;
  id: string;
  state_code: string;
  state_name: string;
}

interface CitiesByQtyView {
  city_name: string;
  congregation_count: number;
  id: string;
  state_code: string;
  state_name: string;
}

interface TotalCountriesView {
  id: string;
  total_countries: number;
}

interface TotalCitiesView {
  id: string;
  total_cities: number;
}
interface TotalStatesView {
  id: string;
  total_states: number;
}

export const GET: RequestHandler = async ({ locals }) => {
  const client = locals.api;

  if (!client?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }

  const [countriesByQty, statesByQty, citiesByQty, totalCities, totalStates, totalCountries] = await Promise.all([
    withRetry(() =>
      client.collection('countriesByQty').getFullList({ sort: '-congregation_count', requestKey: 'dash-countries-qty' })
    ).catch(() => []),
    withRetry(() =>
      client.collection('statesByQty').getFullList({
        sort: '-congregation_count',
        requestKey: 'dash-states-qty'
      })
    ).catch(() => []),
    withRetry(() =>
      client.collection('citiesByQty').getFullList({ sort: '-congregation_count', requestKey: 'dash-cities-qty' })
    ).catch(() => []),
    withRetry(() => client.collection('totalCities').getFullList({ requestKey: 'dash-total-cities' })).catch(() => []),
    withRetry(() => client.collection('totalStates').getFullList({ requestKey: 'dash-total-states' })).catch(() => []),
    withRetry(() => client.collection('totalCountries').getFullList({ requestKey: 'dash-total-countries' })).catch(
      () => []
    )
  ]);

  const topCountries = (countriesByQty as unknown as CountriesByQtyView[])
    .slice(0, 5)
    .map((c) => ({ name: c.country_name || '', count: c.congregation_count ?? 0 }));

  const topStates = (statesByQty as unknown as StatesByQtyView[])
    .slice(0, 5)
    .map((s) => ({ name: s.state_name || '', count: s.congregation_count ?? 0 }));

  const topCities = (citiesByQty as unknown as CitiesByQtyView[])
    .slice(0, 5)
    .map((c) => ({ name: c.city_name || '', count: c.congregation_count ?? 0 }));

  const totalCitiesData = (totalCities as unknown as TotalCitiesView[])?.[0];
  const totalCitiesCount = totalCitiesData?.total_cities ?? 0;
  const totalStatesData = (totalStates as unknown as TotalStatesView[])?.[0];
  const totalStatesCount = totalStatesData?.total_states ?? 0;
  const totalCountriesData = (totalCountries as unknown as TotalCountriesView[])?.[0];
  const totalCountriesCount = totalCountriesData?.total_countries ?? 0;

  return json({
    topCountries,
    topStates,
    topCities,
    totalCities: totalCitiesCount,
    totalStates: totalStatesCount,
    totalCountries: totalCountriesCount
  });
};
