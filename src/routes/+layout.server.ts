/* region imports */
import { cleanResponse, handleError } from '$lib/server/api';
// import { log } from '$lib/server/logger';
/* endregion imports */

export async function load({ cookies, fetch, locals }) {
  const { api } = locals;
  const user = api.authStore.record;
  const lang = cookies.get('lang') || user?.lang || 'en';

  const countries = await api.collection('countries').getFullList({
    fetch
  });

  try {
    return {
      countries: countries.map((c) => cleanResponse(c)),
      lang,
      user
    };
  } catch (err) {
    return handleError(err as Error);
  }
}
