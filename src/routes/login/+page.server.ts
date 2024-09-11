/* region imports */
import { loginSchema } from '$lib/schemas';
/* endregion imports */

export const load = async ({ locals }) => {
	const form = await locals.validate(loginSchema);

	return { form };
};
