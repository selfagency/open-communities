/* region imports */
import { z } from 'zod';
/* endregion imports */

export const contactSchema = z.object({
	captcha: z.string().optional(),
	email: z.string().email(),
	message: z.string(),
	name: z.string(),
	reason: z.enum(['question', 'claim', 'delete', 'suggest']),
	record: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional())
});
