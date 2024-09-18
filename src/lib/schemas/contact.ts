/* region imports */
import { z } from 'zod';
/* endregion imports */

export const contactSchema = z.object({
	reason: z.enum(['question', 'claim', 'delete', 'suggest']),
	record: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
	email: z.string().email(),
	name: z.string(),
	message: z.string(),
	captcha: z.string().optional()
});
