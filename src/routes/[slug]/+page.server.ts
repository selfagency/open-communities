/* region imports */
import { throwAsHttpError } from '$lib/server/api';
/* endregion imports */

export async function load({ fetch, locals, params }) {
  const { api } = locals;

  try {
    return {
      content: await api.collection('pages').getFirstListItem(api.filter('slug={:slug}', { slug: params.slug }), {
        fetch
      })
    };
  } catch (err) {
    throwAsHttpError(err as Error);
  }
}
