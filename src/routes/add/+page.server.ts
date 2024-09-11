/* region imports */
import { defaultSchema } from '$lib/schemas';
/* endregion imports */

export const load = async ({ locals }) => {
	const form = await locals.validate(defaultSchema);

	return { form };
};
