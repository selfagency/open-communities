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

/* region helpers */

function fetchTopCountries(client: ReturnType<typeof import('$lib/server/api').createApi>) {
  return withRetry(() => client.collection('countriesByQty').getFullList({ sort: '-congregation_count' })).catch(
    () => []
  ) as Promise<CountriesByQtyView[]>;
}

function fetchTopStates(client: ReturnType<typeof import('$lib/server/api').createApi>) {
  return withRetry(() => client.collection('statesByQty').getFullList({ sort: '-congregation_count' })).catch(
    () => []
  ) as Promise<StatesByQtyView[]>;
}

function fetchTopCities(client: ReturnType<typeof import('$lib/server/api').createApi>) {
  return withRetry(() => client.collection('citiesByQty').getFullList({ sort: '-congregation_count' })).catch(
    () => []
  ) as Promise<CitiesByQtyView[]>;
}

function fetchTotalCount(client: ReturnType<typeof import('$lib/server/api').createApi>, collection: string) {
  return withRetry(() => client.collection(collection).getFullList()).catch(() => []);
}

function getFirstCount(data: Record<string, unknown>[], field: string): number {
  return (data[0]?.[field] as number) ?? 0;
}

/* endregion helpers */

export const GET: RequestHandler = async ({ locals }) => {
  const client = locals.api;

  if (!client?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }

  const [countriesByQty, statesByQty, citiesByQty, totalCities, totalStates, totalCountries] = await Promise.all([
    fetchTopCountries(client),
    fetchTopStates(client),
    fetchTopCities(client),
    fetchTotalCount(client, 'totalCities'),
    fetchTotalCount(client, 'totalStates'),
    fetchTotalCount(client, 'totalCountries')
  ]);

  const topCountries = countriesByQty
    .slice(0, 5)
    .map((c) => ({ name: c.country_name || '', count: c.congregation_count ?? 0 }));
  const topStates = statesByQty
    .slice(0, 5)
    .map((s) => ({ name: s.state_name || '', count: s.congregation_count ?? 0 }));
  const topCities = citiesByQty.slice(0, 5).map((c) => ({ name: c.city_name || '', count: c.congregation_count ?? 0 }));

  return json({
    topCountries,
    topStates,
    topCities,
    totalCities: getFirstCount(totalCities, 'total_cities'),
    totalStates: getFirstCount(totalStates, 'total_states'),
    totalCountries: getFirstCount(totalCountries, 'total_countries')
  });
};
