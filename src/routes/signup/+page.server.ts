/* region imports */
import { userSchema } from '$lib/schemas';
/* endregion imports */

export const load = async ({ locals }) => {
	const form = await locals.validate(userSchema);

	return { form };
};
