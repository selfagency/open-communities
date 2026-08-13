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
  // biome-ignore lint/suspicious/noUnnecessaryConditions: data[0] is undefined for empty arrays despite the non-null element type
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
    .map((c) => ({ count: c.congregation_count ?? 0, name: c.country_name || '' }));
  const topStates = statesByQty
    .slice(0, 5)
    .map((s) => ({ count: s.congregation_count ?? 0, name: s.state_name || '' }));
  const topCities = citiesByQty.slice(0, 5).map((c) => ({ count: c.congregation_count ?? 0, name: c.city_name || '' }));

  return json({
    topCities,
    topCountries,
    topStates,
    totalCities: getFirstCount(totalCities, 'total_cities'),
    totalCountries: getFirstCount(totalCountries, 'total_countries'),
    totalStates: getFirstCount(totalStates, 'total_states')
  });
};
